# Changelog

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
