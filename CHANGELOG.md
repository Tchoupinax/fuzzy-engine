# Changelog

## 1.8.0 | 2023-10-02

#### Chores

- Upgrade to Node.js 20

## 1.7.2 | 2023-08-08

#### Features

- Fix password manager autocompletion for Docker Registry

## 1.7.1 | 2023-05-16

#### Features

- Improve auto pagination

#### Chores

- Upgrade dependencies
- Remove console.log

## 1.7.0 | 2023-05-06

AWS CLI was dropped and now it uses the standard api with SDK. Intructions to use a local authentication with Docker are available in the readme.
Now cache is built for every page client side to improve the experience when consulting data intensively

#### Features

- Classic usage of AWS SDK with local authentication (awscli)
- Add cache everywhere in app, transitions are smoother

#### Chores

- Upgrade to the latest version of Nuxt.js (v3.4.3)
- Upgrage packages

## 1.6.0 | 2022-11-05

Nuxt.js v3 is definitively coming. The bridge has been removed and the framework has been updated to the last current version (Nuxt.js v3-rc13).

Also, the project supports Amazon ECR but now it supports the authentication from the CLI.
⚠️ That means use the `aws` CLI with a child process to perform operations.

#### Features

- You can authenticate yourself to ECR via aws CLI

#### Chores

- Upgrade to the latest version of Nuxt.js (v3-rc13)
- Upgrade dependencies
- Improve usage of Typescript, types and code architecture

## 1.5.1 | 2022-10-07

### Fixes

- Compute the real endpoint for hitting the API

## 1.5.0 | 2022-09-30

#### Features

- Allow to connect to DockerHub

## 1.4.2 | 2022-07-22

Allow passwordless auth for docker-registry v2 [#28](https://github.com/Tchoupinax/fuzzy-engine/issues/28)

## 1.4.1 | 2022-07-21

Fix [#25](https://github.com/Tchoupinax/fuzzy-engine/issues/25) by fixing the Dockerfile

## 1.4.0 | 2022-06-26

On the way to Nuxt 3 💚

This version brings a big refacto of the project and a step to migrate to Nuxt 3.

Welcome to [Github Container registry!](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

#### Features

- Now use Nuxt 3 Bride
- Refacto the API, love SPA 🔥
- Skeleton of API tests with vitest
- Improve client navigation and speed

## 1.3.1 | 2022-04-02

#### Style

- Improve style of title of a repository

#### Chores:

- Upgrade to Node.js v16
- Improve README

## 1.3.0 | 2022-04-02

#### Features:

- Now display each architecture available for a an image

#### Chores:

- Several improvements

## 1.2.0 | 2022-02-27

#### Features:

- A page has been added to view the ten latest image which has been pushed to the registry 🚀

#### Chores:

- Upgrade dependancies

## 1.1.0 | 2021-10-20

#### Features:

- Now supports AWS container registry ! 🎉🎉

#### Chores:

- Upgrade tailwindCSS

## 1.0.10 | 2021-03-23

#### Fixes:

- Allow docker image to contains a slash

## 1.0.9 | 2020-10-24

#### Features:

- Empty repository (with no tag) are no longer displayed on the list view
- Add the feature to remove all the tag for a repository

#### Fixes:

- Add a default value for the localstorage (feature for hiding repositories)
- Repair url display in the list view

#### Chores:

- Upgrade npm dependancies

## 1.0.8 | 2020-10-16

#### Features:

- You can now hide repositories on the list to keep the most important repository you want in the list
- Add several color for the theme and improve icons
- Allow to connect to localhost repository (with http)

#### Fixes:

- CSS alignment when tag count is higher than 10

## 1.0.7 | 2020-09-05

#### Features:

- Sort tag by created date on repository view

#### Fixes:

- Upgrade dependencies
- Add bottom margin on list view

#### docker image

```
docker pull tchoupinax/fuzzy-engine:v1.0.7
```

## 1.0.6 | 2020-08-18

#### Features:

- On the view list, the count of tag for each repository is displayed

#### Fixes:

- Several little fixes

#### docker image

```
docker pull tchoupinax/fuzzy-engine:v1.0.6
```

## 1.0.5 | 2020-08-18

#### Features:

- Add navigations button to return on the previous page
- Change yellow theme to orange

#### Fixes:

- Improve UX (text size, notification place)
- Upgrade package dependancies

#### docker image

```
docker pull tchoupinax/fuzzy-engine:v1.0.5
```

## 1.0.4 | 2020-05-13

#### Fixes:

- Bad digest was used to delete so it broke the delete feature

#### docker image

```
docker pull tchoupinax/fuzzy-engine:v1.0.4
```

## 1.0.3 | 2020-05-08

#### Features:

- Add tooltip for size and created date

#### Fixes:

- Fix default color and footer position

#### docker image

```
docker pull tchoupinax/fuzzy-engine:v1.0.3
```

## 1.0.2 | 2020-05-07

#### Features:

- Add size and created date for each digest
- Add theme color
- Add Github link in the footer

#### Fixes:

- Improve credentials read from cookie
- Improve readme with FAQ

#### docker image

```
docker pull tchoupinax/fuzzy-engine:v1.0.2
```

## 1.0.1 | 2020-05-07

#### Fixes:

- Fix typo in readme
- Start the roadmap part
- Do not forward headers from reverse proxy
- Deploy demo url

#### docker image

```
docker pull tchoupinax/fuzzy-engine:v1.0.1
```

## 1.0.0 | 2020-05-06

Initial release of the project

#### Features:

- List all repositories present on your private registry
- List all digest for each repository and show available tag for each one
- Delete a digest with one click
- Provide and lock url, username or password from environment variable
