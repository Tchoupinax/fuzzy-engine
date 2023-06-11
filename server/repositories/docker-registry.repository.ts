import axios, { AxiosError } from 'axios'
import prettyBytes from 'pretty-bytes'
import { Option } from '@swan-io/boxed'
import { listRepositoriesTagsAnswer, RegistryApiRepository } from '../gateways/registry-api.gateway'
import { logger } from '../tools/logger'

export type DockerApiRepositoryConfig = { url: string, username: string, password: string };

export type DockerRegistryRepositoryName = string;

export class DockerApiRepository implements RegistryApiRepository {
  constructor (private config: DockerApiRepositoryConfig) {}

  async listRepositories (
    limit: number,
    offset: number,
    name: Option<string>
  ): Promise<any[]> {
    const repositoryNames: Array<DockerRegistryRepositoryName> = await this.internalListRepositories(
      limit,
      offset,
      name,
    )

    const repositories = await Promise.all(repositoryNames.map(
      async (repositoryName: string) => {
        return await this.internalListRepositoryTags(repositoryName)
          .then(({ name, tags }) => {
            return {
              name,
              countOfTags: Array.isArray(tags) ? tags.length : 0,
            }
          })
      })
    )

    // Remove empty repository from the list
    const filteredRepositories = repositories
      .filter(r => r).filter(r => r.countOfTags > 0)

    return filteredRepositories
  }

  async listRepositoriesTags (
    repositoryName: string
  ): Promise<listRepositoriesTagsAnswer> {
    const { tags } = await this.internalListRepositoryTags(repositoryName)

    if (tags === null) {
      return {
        noTag: true,
        name: repositoryName,
        digests: [],
      }
    }

    const tagsWithDigest = await Promise.all(
      tags.map(async (tag) => {
        const {
          headers: { 'docker-content-digest': digest },
          data: { layers },
        } = await axios({
          method: 'GET',
          url: `${this.getComputedUrl()}/v2/${repositoryName}/manifests/${tag}`,
          headers: {
            Accept: 'application/vnd.docker.distribution.manifest.v2+json',
          },
        })

        const architectures = await this.getArchitecture(repositoryName, tag)
        // @ts-ignore
        const size = layers.reduce((acc, cur) => acc + cur.size, 0)

        // Get creation date
        const { data: { history: [{ v1Compatibility }] } } = await axios({
          method: 'GET',
          url: `${this.getComputedUrl()}/v2/${repositoryName}/manifests/${tag}`,
        })

        return {
          name: tag,
          digest: digest.slice(7, 19),
          fullDigest: digest,
          size: prettyBytes(size),
          created: JSON.parse(v1Compatibility).created,
          architectures,
        }
      })
    )

    const finalDigests = new Map()
    tagsWithDigest.forEach(({ name, digest, size, created, fullDigest, architectures }) => {
      if (finalDigests.has(digest)) {
        finalDigests.set(digest, {
          name: digest,
          tags: [...finalDigests.get(digest).tags, name],
          size,
          created,
          fullDigest,
          architectures,
        })
      } else {
        finalDigests.set(digest, { name: digest, tags: [name], size, created, fullDigest, architectures })
      }
    })

    return {
      noTag: false,
      name: repositoryName,
      digests: Array.from(finalDigests.values())
        .sort((a, b) => {
          if (a.created > b.created) {
            return -1
          } else if (a.created < b.created) {
            return 1
          } else {
            return 0
          }
        }),
    }
  }

  private getComputedUrl () {
    let protocol = 'https'

    if (this.config.url.includes('localhost')) {
      protocol = 'http'
    }

    return `${protocol}://${this.config.username}:${this.config.password}@${this.config.url}`
  }

  private async getArchitecture (name: string, tag: string) {
    const {
      data,
    } = await axios({
      method: 'GET',
      url: `${this.getComputedUrl()}/v2/${name}/manifests/${tag}`,
      headers: {
        Accept: 'application/vnd.docker.distribution.manifest.list.v2+json', // Manifest list, aka “fat manifest”
      },
    })

    if (!data.manifests) {
      return [data.architecture]
    }

    return data.manifests.map((m: any) => {
      return `${m.platform.os}/${m.platform.architecture}${m.platform.variant ?? ''}`
    })
  }

  private async internalListRepositories (
    limit: number,
    offset: number,
    name: Option<string>,
  ): Promise<Array<DockerRegistryRepositoryName>> {
    let answer

    try {
      answer = await axios({
        method: 'GET',
        url: `${this.getComputedUrl()}/v2/_catalog`,
      })
    } catch (err) {
      logger.error((err as AxiosError).response?.data)
      throw err
    }

    // If we have a name to match, we filter repositories here
    if (name && name.isSome()) {
      return answer.data.repositories.filter((repositoryName: string) => repositoryName.includes(name.get()))
    } else {
      return answer.data.repositories.slice(offset, offset + limit)
    }
  }

  private async internalListRepositoryTags (
    repositoryName: string
  ): Promise<{ name: string, tags: Array<string> }> {
    const answer = await axios({
      method: 'GET',
      url: `${this.getComputedUrl()}/v2/${repositoryName}/tags/list`,
    })

    return answer.data
  }
}
