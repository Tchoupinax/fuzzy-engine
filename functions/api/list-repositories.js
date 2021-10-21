import {
  DescribeRepositoriesCommand,
  ListImagesCommand,
} from '@aws-sdk/client-ecr';
import getBaseUrl from '../getBaseUrl';

export default async function (provider, redirect, { $axios, $aws }, store) {
  switch (provider) {
    case 'aws-ecr': {
      let {
        repositories: repositoriesAws,
      } = await $aws.send(new DescribeRepositoriesCommand({}));

      repositoriesAws = await Promise.all(repositoriesAws.map(async ({
        repositoryName,
      }) => {
        const {
          imageIds,
        } = await $aws.send(new ListImagesCommand({
          repositoryName,
        }));

        return {
          name: repositoryName,
          countOfTags: imageIds.length,
        };
      }));

      return repositoriesAws;
    }

    case 'docker-registry-v2': {
      let repositories;
      try {
        ({
          data: {
            repositories,
          },
        } = await $axios({
          method: 'GET',
          url: `${getBaseUrl(store.state)}/v2/_catalog`,
        }));
      } catch (err) {
        if (err.errno) {
          return redirect('/?error=ENOTFOUND');
        }
        if (err.response.status === 401) {
          return redirect('/?error=401');
        }

        return {
          repositories: [],
        };
      };

      repositories = await Promise.all(repositories.map((repository) => {
        return $axios({
          method: 'GET',
          url: `${getBaseUrl(store.state)}/v2/${repository}/tags/list`,
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
  }
}
