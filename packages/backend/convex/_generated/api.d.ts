/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as critiques_mutations from "../critiques/mutations.js";
import type * as crons from "../crons.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_urlUtils from "../lib/urlUtils.js";
import type * as likes_mutations from "../likes/mutations.js";
import type * as portfolios_actions from "../portfolios/actions.js";
import type * as portfolios_mutations from "../portfolios/mutations.js";
import type * as portfolios_queries from "../portfolios/queries.js";
import type * as portfolios_scheduled from "../portfolios/scheduled.js";
import type * as portfolios_seeds from "../portfolios/seeds.js";
import type * as privateData from "../privateData.js";
import type * as upload from "../upload.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as users_sync from "../users/sync.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "critiques/mutations": typeof critiques_mutations;
  crons: typeof crons;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/constants": typeof lib_constants;
  "lib/urlUtils": typeof lib_urlUtils;
  "likes/mutations": typeof likes_mutations;
  "portfolios/actions": typeof portfolios_actions;
  "portfolios/mutations": typeof portfolios_mutations;
  "portfolios/queries": typeof portfolios_queries;
  "portfolios/scheduled": typeof portfolios_scheduled;
  "portfolios/seeds": typeof portfolios_seeds;
  privateData: typeof privateData;
  upload: typeof upload;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "users/sync": typeof users_sync;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
