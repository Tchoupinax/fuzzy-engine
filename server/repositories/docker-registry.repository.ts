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
      (repositoryName: string) => {
        return this.internalListRepositoryTags(repositoryName)
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
    logger.debug({ tags }, 'tags detected')

    if (tags === null) {
      return {
        noTag: true,
        name: repositoryName,
        digests: [],
      }
    }

    const tagsWithDigest = await Promise.all(
      tags.map(async (tag) => {
        const { layers, digest } = await this.internalGetManifestData(repositoryName, tag)

        const architectures = await this.getArchitectures(repositoryName, tag)
        const size = layers.reduce((acc, cur) => acc + cur.size, 0)

        const creationDate = await this.getCreationDate(repositoryName, tag)

        return {
          name: tag,
          digest: digest.slice(7, 19),
          fullDigest: digest,
          size: prettyBytes(size),
          created: creationDate,
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

  private getArchitectures (
    repositoryName: string,
    tag: string
  ): Promise<Array<any>> {
    return axios({
      method: 'GET',
      url: `${this.getComputedUrl()}/v2/${repositoryName}/manifests/${tag}`,
      headers: {
        Accept: 'application/vnd.docker.distribution.manifest.list.v2+json', // Manifest list, aka “fat manifest”
      },
    })
      .then((answer) => {
        if (!answer.data.manifests) {
          return [answer.data.architecture]
        }

        return answer.data.manifests.map((m: any) => {
          return `${m.platform.os}/${m.platform.architecture}${m.platform.variant ?? ''}`
        })
      })
      .catch((err) => {
        logger.error({ error: err.response.data, repositoryName, tag }, 'getArchitectures')
        return []
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
    try {
      const answer = await axios({
        method: 'GET',
        url: `${this.getComputedUrl()}/v2/${repositoryName}/tags/list`,
      })
      return answer.data
    } catch (err) {
      logger.error((err as AxiosError).response?.data)
      return { name: repositoryName, tags: [] }
    }
  }

  private internalGetManifestData (
    repositoryName: string,
    tag: string,
  ): Promise<{
    layers: Array<{ mediaType: string, digest: string, size: number }>;
    digest: string
  }> {
    return axios({
      method: 'GET',
      url: `${this.getComputedUrl()}/v2/${repositoryName}/manifests/${tag}`,
      headers: {
        Accept: 'application/vnd.docker.distribution.manifest.v2+json',
      },
    })
      .then((answer) => {
        return {
          layers: answer.data.layers,
          digest: answer.headers['docker-content-digest']
        }
      })
      .catch((err) => {
        logger.error({ error: err.response.data, repositoryName, tag }, 'internalGetManifestData')
        return {
          layers: [],
          digest: 'N/A'
        }
      })
  }

  private getCreationDate (
    repositoryName: string,
    tag: string,
  ): Promise<Date> {
    return axios({
      method: 'GET',
      url: `${this.getComputedUrl()}/v2/${repositoryName}/manifests/${tag}`,
    })
      .then((answer) => {
        const obj = answer.data.history[0].v1Compatibility
        return new Date(JSON.parse(obj).created)
      })
      .catch((err) => {
        logger.error({ error: err.response.data, repositoryName, tag }, 'getCreationDate')
        return new Date(0)
      })
  }

  async deleteImageDigest (repositoryName: string, tag: string): Promise<boolean> {
    try {
      const { headers } = await axios({
        method: 'HEAD',
        url: `${this.getComputedUrl()}/v2/${repositoryName}/manifests/${tag}`,
        headers: {
          Accept: 'application/vnd.docker.distribution.manifest.v2+json',
        },
      })

      const answer = await axios({
        method: 'DELETE',
        url: `${this.getComputedUrl()}/v2/${repositoryName}/manifests/${headers['docker-content-digest']}`,
      })
      return answer.data
    } catch (err) {
      logger.error((err as AxiosError).response?.data)
      return false
    }
  }
}
