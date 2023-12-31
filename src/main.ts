import { chunk } from "https://deno.land/std@0.197.0/collections/chunk.ts";
import ProgressBar from "https://deno.land/x/progress@v1.3.8/mod.ts";

const fetchPage = async (page: number = 1) => {
  const res = await fetch(
    `https://www.myhome.ge/ka/s/?Keyword=&mapC=&cities=1996871&GID=1996871&Ajax=1&Page=${page}`,
  );

  return await res.json();
};

const cachedFetchPage = async (page: number = 1) => {
  const path = `./cache/${page}.json`;
  try {
    const data = await Deno.readTextFile(path);
    const parsed = JSON.parse(data);
    //console.log("cachedFetchPage", page, "hit");
    return parsed;
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      //console.log("cachedFetchPage", page, "miss");
      const data = await fetchPage(page);
      await Deno.writeTextFile(path, JSON.stringify(data));
      return data;
    }
  }
};

const preloadPages = async (pages: number[] = []) => {
  const data = [];
  let i = 0;
  for (const page of pages) {
    // if (i % 50 === 0) {
    //   console.log(
    //     "preloadPages",
    //     `[${Math.min(...pages)}-${Math.max(...pages)}]`,
    //     "loading",
    //     page,
    //     "out of",
    //     pages.length,
    //   );
    // }
    data.push(await cachedFetchPage(page));
    completed++;
    progress.render(completed++);
  }
  return data;
};

let progress: any, completed = 0;

export const main = async (): Promise<void> => {
  const totalPages = 12168;
  progress = new ProgressBar({
    total: totalPages,
    display: ":bar :percent elapsed :time eta :eta",
  });
  const chunks = chunk(
    new Array(totalPages).fill(0).map((_, i) => i + 1),
    2000,
  );
  const dataChunks = await Promise.all(
    chunks.map((pages) => preloadPages(pages)),
  );

  const data = dataChunks.flat();
  Deno.writeTextFile("./data/data.json", JSON.stringify(data));

  const products = data.flatMap((item) => item.Data.Prs);
  Deno.writeTextFile("./data/products.json", JSON.stringify(products));

  const maklers = data.flatMap((item) => item.Data.Maklers);
  Deno.writeTextFile("./data/maklers.json", JSON.stringify(maklers));

  const floors = data.flatMap((item) => Object.values(item.Data.Floors).flat());
  Deno.writeTextFile("./data/floors.json", JSON.stringify(floors));

  const users = data.flatMap((item) => Object.values(item.Data.Users.Data));
  Deno.writeTextFile("./data/users.json", JSON.stringify(users));

  const mapDataPoints = data.flatMap((item) => item.Data.MapData.Points);
  Deno.writeTextFile(
    "./data/mapData_points.json",
    JSON.stringify(mapDataPoints),
  );

  const districts = data.flatMap((item) =>
    Object.values(item.Data.Districts.Locs)
  );
  Deno.writeTextFile("./data/district_locs.json", JSON.stringify(districts));
};

if (import.meta.main) {
  await main();
}
