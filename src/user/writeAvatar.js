/*
Writes out to Redis the avatar, location, and name
*/

import gql from "graphql-tag";
import { hset } from "./../redis/writeUtils";
import {
  getJsonKeyFromFile,
  readJsonDataFromFilename
} from "./../util/file-util";
import { getClient } from "./../util/apollo-util";
import { getGithubData } from "./../util/github-util";
import { handlePromise } from "./../util/promise-util";
import { getPinnedRepoNames } from "./../util/repo-util";

const query = gql`
  query User($login: String!) {
    user(login: $login) {
      pinnedRepositories(first: 6) {
        edges {
          node {
            name
          }
        }
      }
      avatarUrl(size: 400)
      location
      name
    }
  }
`;

async function getUserFromData(client, options, value) {
  let login = options.login;
  let avatar = value.data.user.avatarUrl;
  let location = value.data.user.location;
  let name = value.data.user.name;
  let pinnedRepo = value.data.user.pinnedRepositories;

  if (avatar != null) {
    hset(login, "avatar", avatar);
  }
  if (location != null) {
    hset(login, "location", location);
  }
  if (name != null) {
    hset(login, "name", name);
  }
  if (pinnedRepo.edges.length != 0) {
    // console.log('pinned repository user = ', login);
    let jsonAry = getPinnedRepoNames(pinnedRepo.edges);
    hset(login, "pinnedRepo", jsonAry);
  }
}

async function goGql(options) {
  let githubApiKey = await getJsonKeyFromFile("./data/f1.js");
  let client = await getClient(githubApiKey);
  let json = await getGithubData(client, options, query);
  let data = await handlePromise(json);
  await getUserFromData(client, options, data);
}

export async function writeAvatar(logins) {
  logins.forEach(function(user) {
    const options = { login: user };
    goGql(options);
  });
}

// For testing only
// const logins = ["oliviertassinari", "stormasm", "antirez"];
// writeAvatar(logins);
