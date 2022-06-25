import { RegistryApiRepository } from "../gateways/registry-api";
import axios from 'axios';

export class DockerApiRepository implements RegistryApiRepository {
  constructor(private baseUrl: string, private username: string, private password: string) {}

  async listRepositories(): Promise<any[]> {
    console.log(this.baseUrl)
    console.log(`${this.baseUrl}/v2/_catalog`)
    let repositories;
    try {
      ({
        data: {
          repositories,
        },
      } = await axios({
        method: 'GET',
        url: `${this.baseUrl}/v2/_catalog`,
      }));
    } catch (err) {
      console.log(err.message)
      // Catch error
      // if (err.errno) {
      //   return redirect('/?error=ENOTFOUND');
      // }
      // if (err.response.status === 401) {
      //   return redirect('/?error=401');
      // }

      return [];
    };

    repositories = await Promise.all(repositories.map((repository) => {
      return axios({
        method: 'GET',
        url: `${this.baseUrl}/v2/${repository}/tags/list`,
      })
        .then(({
          data,
        }) => {
          return {
            name: data.name,
            countOfTags: Array.isArray(data.tags) ? data.tags.length : 0,
          };
        })
        // eslint-disable-next-line handle-callback-err
        .catch((err) => {
          return null;
        });
    }));

    // Remove empty repository from the list
    const filteredRepositories = repositories.filter(r => r).filter(r => r.countOfTags > 0);

    return filteredRepositories;
  }

  listRepositoriesTags(repositoryName: string): Promise<any[]> {
    return Promise.resolve([])
  }
}
