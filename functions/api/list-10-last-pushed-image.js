import listRepository from '@/functions/api/list-repositories';
import listTag from '@/functions/api/list-tags';

export default async function (provider, redirect, { $axios, $aws }, store) {
  const names = (await listRepository(provider, redirect, { $axios, $aws }, store)).map(zz => zz.name);

  const aa = await Promise.all(names.map(n => listTag(provider, n, { $axios, $aws }, store)));

  return aa
    .reduce((acc, cur) => {
      return [...acc, cur.digests.map(d => ({
        name: cur.name,
        tag: d.tags[0],
        size: d.size,
        created: d.created,
      }))].flat();
    }, [])
    .sort((a, b) => {
      if (new Date(a.created) < new Date(b.created)) {
        return 1;
      }

      return -1;
    })
    .slice(0, 15);
}
