import { Option } from '@swan-io/boxed'
import { RegistryApiRepository } from '../gateways/registry-api.gateway'

export type listLatest10TagsAnswer = {
  name: string;
  tag: string;
  size: number;
  created: Date;
};

export class ListLatest10TagsUseCase {
  constructor (private repository: RegistryApiRepository) {}

  async execute () {
    const names = (await this.repository.listRepositories(10, 0, Option.None())).map(zz => zz.name)
    const aa = await Promise.all(names.map(n => this.repository.listRepositoriesTags(n)))

    return aa
      .reduce((acc, cur) => {
        return [...acc, cur.digests.map(d => ({
          name: cur.name,
          tag: d.tags[0],
          size: d.size,
          created: d.created,
        }))].flat()
      }, [])
      .sort((a, b) => {
        if (new Date(a.created) < new Date(b.created)) {
          return 1
        }

        return -1
      })
      .slice(0, 15)
  }
}
