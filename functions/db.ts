import { Option } from "@swan-io/boxed";
import { getCookie } from "~~/functions/cookies";

export class DB {
  public upsertRepositories(repositories: Array<any>): Option<Array<any>> {
    const alreadySavedRepositories = this.findRepositories();

    let repositoriesToSave = [];
    if (alreadySavedRepositories.isSome()) {
      repositoriesToSave = Array.from(
        new Set(
          [...alreadySavedRepositories.get(), ...repositories].map((obj) =>
            JSON.stringify(obj),
          ),
        ),
      ).map((obj) => JSON.parse(obj));
    } else {
      repositoriesToSave = [...repositories];
    }

    localStorage.setItem(
      this.computeKey("repositories"),
      JSON.stringify(repositoriesToSave),
    );

    return Option.Some(repositoriesToSave);
  }

  public findRepositories(): Option<Array<any>> {
    const item = localStorage.getItem(this.computeKey("repositories"));

    if (item) {
      return Option.Some(JSON.parse(item));
    }

    return Option.None();
  }

  public saveRepositoryImages(repositoryName: string, images: any): void {
    localStorage.setItem(
      this.computeKey(`images-for-repo-${repositoryName}`),
      JSON.stringify(images),
    );
  }

  public findRepositoryImages(repositoryName: string): Option<any> {
    const item = localStorage.getItem(
      this.computeKey(`images-for-repo-${repositoryName}`),
    );

    if (item) {
      return Option.Some(JSON.parse(item));
    }

    return Option.None();
  }

  public saveLatestRepositories(repositories: Array<any>): Option<Array<any>> {
    localStorage.setItem(
      this.computeKey("latest-repositories"),
      JSON.stringify(repositories),
    );

    return Option.Some(repositories);
  }

  public findLatestRepositories(): Option<Array<any>> {
    const item = localStorage.getItem(this.computeKey("latest-repositories"));

    if (item) {
      return Option.Some(JSON.parse(item));
    }

    return Option.None();
  }

  private computeKey(key: string): string {
    const provider = Option.fromNullable(getCookie("fuzzy-engine-provider"));
    if (provider.isSome()) {
      key = `${provider.get()}-${key}`;
    }

    return key;
  }
}
