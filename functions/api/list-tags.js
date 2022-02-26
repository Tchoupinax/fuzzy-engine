import prettyBytes from 'pretty-bytes';
import { DescribeImagesCommand } from '@aws-sdk/client-ecr';
import getBaseUrl from '../getBaseUrl';

export default async function (provider, name, { $axios, $aws }, store) {
  switch (provider) {
    case 'aws-ecr': {
      const { imageDetails } = await $aws.send(new DescribeImagesCommand({ repositoryName: name }));

      const digests = imageDetails.map((i) => {
        return {
          name: i.imageTags[0],
          digest: i.imageDigest.replace('sha256:', '').slice(7, 19),
          fullDigest: i.imageDigest,
          created: i.imagePushedAt,
          size: prettyBytes(i.imageSizeInBytes),
        };
      });

      const finalDigests = new Map();
      digests.forEach(({ name, digest, size, created, fullDigest }) => {
        if (finalDigests.has(digest)) {
          finalDigests.set(digest, {
            name: digest,
            tags: [...finalDigests.get(digest).tags, name],
            size,
            created,
            fullDigest,
          });
        } else {
          finalDigests.set(digest, { name: digest, tags: [name], size, created, fullDigest });
        }
      });

      return {
        noTag: false,
        name,
        digests: Array.from(finalDigests.values())
          .sort((a, b) => {
            if (a.created > b.created) {
              return -1;
            } else if (a.created > b.created) {
              return 1;
            } else {
              return 0;
            }
          }),
      };
    }
    case 'docker-registry-v2': {
      const { data: { tags } } = await $axios({
        method: 'GET',
        url: `${getBaseUrl(store.state)}/v2/${name}/tags/list`,
      });

      if (tags === null) {
        return {
          noTag: true,
          name,
          digests: [],
        };
      }

      const tagsWithDigest = await Promise.all(tags.map(async (tag) => {
        const {
          headers: { 'docker-content-digest': digest },
          data: { layers },
        } = await $axios({
          method: 'GET',
          url: `${getBaseUrl(store.state)}/v2/${name}/manifests/${tag}`,
          headers: {
            Accept: 'application/vnd.docker.distribution.manifest.v2+json',
          },
        });

        const size = layers.reduce((acc, cur) => acc + cur.size, 0);

        // Get creation date
        const { data: { history: [{ v1Compatibility }] } } = await $axios({
          method: 'GET',
          url: `${getBaseUrl(store.state)}/v2/${name}/manifests/${tag}`,
        });

        return {
          name: tag,
          digest: digest.slice(7, 19),
          fullDigest: digest,
          size: prettyBytes(size),
          created: JSON.parse(v1Compatibility).created,
        };
      }));

      const finalDigests = new Map();
      tagsWithDigest.forEach(({ name, digest, size, created, fullDigest }) => {
        if (finalDigests.has(digest)) {
          finalDigests.set(digest, {
            name: digest,
            tags: [...finalDigests.get(digest).tags, name],
            size,
            created,
            fullDigest,
          });
        } else {
          finalDigests.set(digest, { name: digest, tags: [name], size, created, fullDigest });
        }
      });

      return {
        noTag: false,
        name,
        digests: Array.from(finalDigests.values())
          .sort((a, b) => {
            if (a.created > b.created) {
              return -1;
            } else if (a.created > b.created) {
              return 1;
            } else {
              return 0;
            }
          }),
      };
    }
  }
}