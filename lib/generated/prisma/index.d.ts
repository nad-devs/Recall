
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Category
 * 
 */
export type Category = $Result.DefaultSelection<Prisma.$CategoryPayload>
/**
 * Model Concept
 * 
 */
export type Concept = $Result.DefaultSelection<Prisma.$ConceptPayload>
/**
 * Model Conversation
 * 
 */
export type Conversation = $Result.DefaultSelection<Prisma.$ConversationPayload>
/**
 * Model Occurrence
 * 
 */
export type Occurrence = $Result.DefaultSelection<Prisma.$OccurrencePayload>
/**
 * Model CodeSnippet
 * 
 */
export type CodeSnippet = $Result.DefaultSelection<Prisma.$CodeSnippetPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Categories
 * const categories = await prisma.category.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Categories
   * const categories = await prisma.category.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.category`: Exposes CRUD operations for the **Category** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Categories
    * const categories = await prisma.category.findMany()
    * ```
    */
  get category(): Prisma.CategoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.concept`: Exposes CRUD operations for the **Concept** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Concepts
    * const concepts = await prisma.concept.findMany()
    * ```
    */
  get concept(): Prisma.ConceptDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.conversation`: Exposes CRUD operations for the **Conversation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Conversations
    * const conversations = await prisma.conversation.findMany()
    * ```
    */
  get conversation(): Prisma.ConversationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.occurrence`: Exposes CRUD operations for the **Occurrence** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Occurrences
    * const occurrences = await prisma.occurrence.findMany()
    * ```
    */
  get occurrence(): Prisma.OccurrenceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.codeSnippet`: Exposes CRUD operations for the **CodeSnippet** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CodeSnippets
    * const codeSnippets = await prisma.codeSnippet.findMany()
    * ```
    */
  get codeSnippet(): Prisma.CodeSnippetDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.8.2
   * Query Engine version: 2060c79ba17c6bb9f5823312b6f6b7f4a845738e
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Category: 'Category',
    Concept: 'Concept',
    Conversation: 'Conversation',
    Occurrence: 'Occurrence',
    CodeSnippet: 'CodeSnippet'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "category" | "concept" | "conversation" | "occurrence" | "codeSnippet"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Category: {
        payload: Prisma.$CategoryPayload<ExtArgs>
        fields: Prisma.CategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findFirst: {
            args: Prisma.CategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findMany: {
            args: Prisma.CategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          create: {
            args: Prisma.CategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          createMany: {
            args: Prisma.CategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          delete: {
            args: Prisma.CategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          update: {
            args: Prisma.CategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          deleteMany: {
            args: Prisma.CategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CategoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          upsert: {
            args: Prisma.CategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          aggregate: {
            args: Prisma.CategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCategory>
          }
          groupBy: {
            args: Prisma.CategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<CategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.CategoryCountArgs<ExtArgs>
            result: $Utils.Optional<CategoryCountAggregateOutputType> | number
          }
        }
      }
      Concept: {
        payload: Prisma.$ConceptPayload<ExtArgs>
        fields: Prisma.ConceptFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConceptFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConceptFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          findFirst: {
            args: Prisma.ConceptFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConceptFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          findMany: {
            args: Prisma.ConceptFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>[]
          }
          create: {
            args: Prisma.ConceptCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          createMany: {
            args: Prisma.ConceptCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConceptCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>[]
          }
          delete: {
            args: Prisma.ConceptDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          update: {
            args: Prisma.ConceptUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          deleteMany: {
            args: Prisma.ConceptDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConceptUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ConceptUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>[]
          }
          upsert: {
            args: Prisma.ConceptUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConceptPayload>
          }
          aggregate: {
            args: Prisma.ConceptAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConcept>
          }
          groupBy: {
            args: Prisma.ConceptGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConceptGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConceptCountArgs<ExtArgs>
            result: $Utils.Optional<ConceptCountAggregateOutputType> | number
          }
        }
      }
      Conversation: {
        payload: Prisma.$ConversationPayload<ExtArgs>
        fields: Prisma.ConversationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConversationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConversationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          findFirst: {
            args: Prisma.ConversationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConversationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          findMany: {
            args: Prisma.ConversationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>[]
          }
          create: {
            args: Prisma.ConversationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          createMany: {
            args: Prisma.ConversationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConversationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>[]
          }
          delete: {
            args: Prisma.ConversationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          update: {
            args: Prisma.ConversationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          deleteMany: {
            args: Prisma.ConversationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConversationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ConversationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>[]
          }
          upsert: {
            args: Prisma.ConversationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConversationPayload>
          }
          aggregate: {
            args: Prisma.ConversationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConversation>
          }
          groupBy: {
            args: Prisma.ConversationGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConversationGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConversationCountArgs<ExtArgs>
            result: $Utils.Optional<ConversationCountAggregateOutputType> | number
          }
        }
      }
      Occurrence: {
        payload: Prisma.$OccurrencePayload<ExtArgs>
        fields: Prisma.OccurrenceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OccurrenceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OccurrencePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OccurrenceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OccurrencePayload>
          }
          findFirst: {
            args: Prisma.OccurrenceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OccurrencePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OccurrenceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OccurrencePayload>
          }
          findMany: {
            args: Prisma.OccurrenceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OccurrencePayload>[]
          }
          create: {
            args: Prisma.OccurrenceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OccurrencePayload>
          }
          createMany: {
            args: Prisma.OccurrenceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OccurrenceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OccurrencePayload>[]
          }
          delete: {
            args: Prisma.OccurrenceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OccurrencePayload>
          }
          update: {
            args: Prisma.OccurrenceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OccurrencePayload>
          }
          deleteMany: {
            args: Prisma.OccurrenceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OccurrenceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.OccurrenceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OccurrencePayload>[]
          }
          upsert: {
            args: Prisma.OccurrenceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OccurrencePayload>
          }
          aggregate: {
            args: Prisma.OccurrenceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOccurrence>
          }
          groupBy: {
            args: Prisma.OccurrenceGroupByArgs<ExtArgs>
            result: $Utils.Optional<OccurrenceGroupByOutputType>[]
          }
          count: {
            args: Prisma.OccurrenceCountArgs<ExtArgs>
            result: $Utils.Optional<OccurrenceCountAggregateOutputType> | number
          }
        }
      }
      CodeSnippet: {
        payload: Prisma.$CodeSnippetPayload<ExtArgs>
        fields: Prisma.CodeSnippetFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CodeSnippetFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CodeSnippetPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CodeSnippetFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CodeSnippetPayload>
          }
          findFirst: {
            args: Prisma.CodeSnippetFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CodeSnippetPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CodeSnippetFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CodeSnippetPayload>
          }
          findMany: {
            args: Prisma.CodeSnippetFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CodeSnippetPayload>[]
          }
          create: {
            args: Prisma.CodeSnippetCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CodeSnippetPayload>
          }
          createMany: {
            args: Prisma.CodeSnippetCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CodeSnippetCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CodeSnippetPayload>[]
          }
          delete: {
            args: Prisma.CodeSnippetDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CodeSnippetPayload>
          }
          update: {
            args: Prisma.CodeSnippetUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CodeSnippetPayload>
          }
          deleteMany: {
            args: Prisma.CodeSnippetDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CodeSnippetUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CodeSnippetUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CodeSnippetPayload>[]
          }
          upsert: {
            args: Prisma.CodeSnippetUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CodeSnippetPayload>
          }
          aggregate: {
            args: Prisma.CodeSnippetAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCodeSnippet>
          }
          groupBy: {
            args: Prisma.CodeSnippetGroupByArgs<ExtArgs>
            result: $Utils.Optional<CodeSnippetGroupByOutputType>[]
          }
          count: {
            args: Prisma.CodeSnippetCountArgs<ExtArgs>
            result: $Utils.Optional<CodeSnippetCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    category?: CategoryOmit
    concept?: ConceptOmit
    conversation?: ConversationOmit
    occurrence?: OccurrenceOmit
    codeSnippet?: CodeSnippetOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type CategoryCountOutputType
   */

  export type CategoryCountOutputType = {
    children: number
    concepts: number
  }

  export type CategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    children?: boolean | CategoryCountOutputTypeCountChildrenArgs
    concepts?: boolean | CategoryCountOutputTypeCountConceptsArgs
  }

  // Custom InputTypes
  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryCountOutputType
     */
    select?: CategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeCountChildrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryWhereInput
  }

  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeCountConceptsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConceptWhereInput
  }


  /**
   * Count Type ConceptCountOutputType
   */

  export type ConceptCountOutputType = {
    codeSnippets: number
    categories: number
    occurrences: number
  }

  export type ConceptCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    codeSnippets?: boolean | ConceptCountOutputTypeCountCodeSnippetsArgs
    categories?: boolean | ConceptCountOutputTypeCountCategoriesArgs
    occurrences?: boolean | ConceptCountOutputTypeCountOccurrencesArgs
  }

  // Custom InputTypes
  /**
   * ConceptCountOutputType without action
   */
  export type ConceptCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConceptCountOutputType
     */
    select?: ConceptCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ConceptCountOutputType without action
   */
  export type ConceptCountOutputTypeCountCodeSnippetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CodeSnippetWhereInput
  }

  /**
   * ConceptCountOutputType without action
   */
  export type ConceptCountOutputTypeCountCategoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryWhereInput
  }

  /**
   * ConceptCountOutputType without action
   */
  export type ConceptCountOutputTypeCountOccurrencesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OccurrenceWhereInput
  }


  /**
   * Count Type ConversationCountOutputType
   */

  export type ConversationCountOutputType = {
    concepts: number
    occurrences: number
  }

  export type ConversationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    concepts?: boolean | ConversationCountOutputTypeCountConceptsArgs
    occurrences?: boolean | ConversationCountOutputTypeCountOccurrencesArgs
  }

  // Custom InputTypes
  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConversationCountOutputType
     */
    select?: ConversationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeCountConceptsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConceptWhereInput
  }

  /**
   * ConversationCountOutputType without action
   */
  export type ConversationCountOutputTypeCountOccurrencesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OccurrenceWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Category
   */

  export type AggregateCategory = {
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  export type CategoryMinAggregateOutputType = {
    id: string | null
    name: string | null
    parentId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CategoryMaxAggregateOutputType = {
    id: string | null
    name: string | null
    parentId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CategoryCountAggregateOutputType = {
    id: number
    name: number
    parentId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CategoryMinAggregateInputType = {
    id?: true
    name?: true
    parentId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CategoryMaxAggregateInputType = {
    id?: true
    name?: true
    parentId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CategoryCountAggregateInputType = {
    id?: true
    name?: true
    parentId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Category to aggregate.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Categories
    **/
    _count?: true | CategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CategoryMaxAggregateInputType
  }

  export type GetCategoryAggregateType<T extends CategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCategory[P]>
      : GetScalarType<T[P], AggregateCategory[P]>
  }




  export type CategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryWhereInput
    orderBy?: CategoryOrderByWithAggregationInput | CategoryOrderByWithAggregationInput[]
    by: CategoryScalarFieldEnum[] | CategoryScalarFieldEnum
    having?: CategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CategoryCountAggregateInputType | true
    _min?: CategoryMinAggregateInputType
    _max?: CategoryMaxAggregateInputType
  }

  export type CategoryGroupByOutputType = {
    id: string
    name: string
    parentId: string | null
    createdAt: Date
    updatedAt: Date
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  type GetCategoryGroupByPayload<T extends CategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CategoryGroupByOutputType[P]>
            : GetScalarType<T[P], CategoryGroupByOutputType[P]>
        }
      >
    >


  export type CategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    parentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    parent?: boolean | Category$parentArgs<ExtArgs>
    children?: boolean | Category$childrenArgs<ExtArgs>
    concepts?: boolean | Category$conceptsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    parentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    parent?: boolean | Category$parentArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    parentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    parent?: boolean | Category$parentArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectScalar = {
    id?: boolean
    name?: boolean
    parentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "parentId" | "createdAt" | "updatedAt", ExtArgs["result"]["category"]>
  export type CategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parent?: boolean | Category$parentArgs<ExtArgs>
    children?: boolean | Category$childrenArgs<ExtArgs>
    concepts?: boolean | Category$conceptsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parent?: boolean | Category$parentArgs<ExtArgs>
  }
  export type CategoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parent?: boolean | Category$parentArgs<ExtArgs>
  }

  export type $CategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Category"
    objects: {
      parent: Prisma.$CategoryPayload<ExtArgs> | null
      children: Prisma.$CategoryPayload<ExtArgs>[]
      concepts: Prisma.$ConceptPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      parentId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["category"]>
    composites: {}
  }

  type CategoryGetPayload<S extends boolean | null | undefined | CategoryDefaultArgs> = $Result.GetResult<Prisma.$CategoryPayload, S>

  type CategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CategoryCountAggregateInputType | true
    }

  export interface CategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Category'], meta: { name: 'Category' } }
    /**
     * Find zero or one Category that matches the filter.
     * @param {CategoryFindUniqueArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CategoryFindUniqueArgs>(args: SelectSubset<T, CategoryFindUniqueArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Category that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CategoryFindUniqueOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, CategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CategoryFindFirstArgs>(args?: SelectSubset<T, CategoryFindFirstArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, CategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Categories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Categories
     * const categories = await prisma.category.findMany()
     * 
     * // Get first 10 Categories
     * const categories = await prisma.category.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const categoryWithIdOnly = await prisma.category.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CategoryFindManyArgs>(args?: SelectSubset<T, CategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Category.
     * @param {CategoryCreateArgs} args - Arguments to create a Category.
     * @example
     * // Create one Category
     * const Category = await prisma.category.create({
     *   data: {
     *     // ... data to create a Category
     *   }
     * })
     * 
     */
    create<T extends CategoryCreateArgs>(args: SelectSubset<T, CategoryCreateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Categories.
     * @param {CategoryCreateManyArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CategoryCreateManyArgs>(args?: SelectSubset<T, CategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Categories and returns the data saved in the database.
     * @param {CategoryCreateManyAndReturnArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, CategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Category.
     * @param {CategoryDeleteArgs} args - Arguments to delete one Category.
     * @example
     * // Delete one Category
     * const Category = await prisma.category.delete({
     *   where: {
     *     // ... filter to delete one Category
     *   }
     * })
     * 
     */
    delete<T extends CategoryDeleteArgs>(args: SelectSubset<T, CategoryDeleteArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Category.
     * @param {CategoryUpdateArgs} args - Arguments to update one Category.
     * @example
     * // Update one Category
     * const category = await prisma.category.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CategoryUpdateArgs>(args: SelectSubset<T, CategoryUpdateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Categories.
     * @param {CategoryDeleteManyArgs} args - Arguments to filter Categories to delete.
     * @example
     * // Delete a few Categories
     * const { count } = await prisma.category.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CategoryDeleteManyArgs>(args?: SelectSubset<T, CategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CategoryUpdateManyArgs>(args: SelectSubset<T, CategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories and returns the data updated in the database.
     * @param {CategoryUpdateManyAndReturnArgs} args - Arguments to update many Categories.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CategoryUpdateManyAndReturnArgs>(args: SelectSubset<T, CategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Category.
     * @param {CategoryUpsertArgs} args - Arguments to update or create a Category.
     * @example
     * // Update or create a Category
     * const category = await prisma.category.upsert({
     *   create: {
     *     // ... data to create a Category
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Category we want to update
     *   }
     * })
     */
    upsert<T extends CategoryUpsertArgs>(args: SelectSubset<T, CategoryUpsertArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryCountArgs} args - Arguments to filter Categories to count.
     * @example
     * // Count the number of Categories
     * const count = await prisma.category.count({
     *   where: {
     *     // ... the filter for the Categories we want to count
     *   }
     * })
    **/
    count<T extends CategoryCountArgs>(
      args?: Subset<T, CategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CategoryAggregateArgs>(args: Subset<T, CategoryAggregateArgs>): Prisma.PrismaPromise<GetCategoryAggregateType<T>>

    /**
     * Group by Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CategoryGroupByArgs['orderBy'] }
        : { orderBy?: CategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Category model
   */
  readonly fields: CategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Category.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    parent<T extends Category$parentArgs<ExtArgs> = {}>(args?: Subset<T, Category$parentArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    children<T extends Category$childrenArgs<ExtArgs> = {}>(args?: Subset<T, Category$childrenArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    concepts<T extends Category$conceptsArgs<ExtArgs> = {}>(args?: Subset<T, Category$conceptsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Category model
   */
  interface CategoryFieldRefs {
    readonly id: FieldRef<"Category", 'String'>
    readonly name: FieldRef<"Category", 'String'>
    readonly parentId: FieldRef<"Category", 'String'>
    readonly createdAt: FieldRef<"Category", 'DateTime'>
    readonly updatedAt: FieldRef<"Category", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Category findUnique
   */
  export type CategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findUniqueOrThrow
   */
  export type CategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findFirst
   */
  export type CategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findFirstOrThrow
   */
  export type CategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findMany
   */
  export type CategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Categories to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category create
   */
  export type CategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Category.
     */
    data: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
  }

  /**
   * Category createMany
   */
  export type CategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
  }

  /**
   * Category createManyAndReturn
   */
  export type CategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Category update
   */
  export type CategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Category.
     */
    data: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
    /**
     * Choose, which Category to update.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category updateMany
   */
  export type CategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
  }

  /**
   * Category updateManyAndReturn
   */
  export type CategoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Category upsert
   */
  export type CategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Category to update in case it exists.
     */
    where: CategoryWhereUniqueInput
    /**
     * In case the Category found by the `where` argument doesn't exist, create a new Category with this data.
     */
    create: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
    /**
     * In case the Category was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
  }

  /**
   * Category delete
   */
  export type CategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter which Category to delete.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category deleteMany
   */
  export type CategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Categories to delete
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to delete.
     */
    limit?: number
  }

  /**
   * Category.parent
   */
  export type Category$parentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    where?: CategoryWhereInput
  }

  /**
   * Category.children
   */
  export type Category$childrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    where?: CategoryWhereInput
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    cursor?: CategoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category.concepts
   */
  export type Category$conceptsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    where?: ConceptWhereInput
    orderBy?: ConceptOrderByWithRelationInput | ConceptOrderByWithRelationInput[]
    cursor?: ConceptWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConceptScalarFieldEnum | ConceptScalarFieldEnum[]
  }

  /**
   * Category without action
   */
  export type CategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
  }


  /**
   * Model Concept
   */

  export type AggregateConcept = {
    _count: ConceptCountAggregateOutputType | null
    _avg: ConceptAvgAggregateOutputType | null
    _sum: ConceptSumAggregateOutputType | null
    _min: ConceptMinAggregateOutputType | null
    _max: ConceptMaxAggregateOutputType | null
  }

  export type ConceptAvgAggregateOutputType = {
    confidenceScore: number | null
  }

  export type ConceptSumAggregateOutputType = {
    confidenceScore: number | null
  }

  export type ConceptMinAggregateOutputType = {
    id: string | null
    title: string | null
    category: string | null
    summary: string | null
    details: string | null
    keyPoints: string | null
    examples: string | null
    relatedConcepts: string | null
    relationships: string | null
    confidenceScore: number | null
    lastUpdated: Date | null
    conversationId: string | null
  }

  export type ConceptMaxAggregateOutputType = {
    id: string | null
    title: string | null
    category: string | null
    summary: string | null
    details: string | null
    keyPoints: string | null
    examples: string | null
    relatedConcepts: string | null
    relationships: string | null
    confidenceScore: number | null
    lastUpdated: Date | null
    conversationId: string | null
  }

  export type ConceptCountAggregateOutputType = {
    id: number
    title: number
    category: number
    summary: number
    details: number
    keyPoints: number
    examples: number
    relatedConcepts: number
    relationships: number
    confidenceScore: number
    lastUpdated: number
    conversationId: number
    _all: number
  }


  export type ConceptAvgAggregateInputType = {
    confidenceScore?: true
  }

  export type ConceptSumAggregateInputType = {
    confidenceScore?: true
  }

  export type ConceptMinAggregateInputType = {
    id?: true
    title?: true
    category?: true
    summary?: true
    details?: true
    keyPoints?: true
    examples?: true
    relatedConcepts?: true
    relationships?: true
    confidenceScore?: true
    lastUpdated?: true
    conversationId?: true
  }

  export type ConceptMaxAggregateInputType = {
    id?: true
    title?: true
    category?: true
    summary?: true
    details?: true
    keyPoints?: true
    examples?: true
    relatedConcepts?: true
    relationships?: true
    confidenceScore?: true
    lastUpdated?: true
    conversationId?: true
  }

  export type ConceptCountAggregateInputType = {
    id?: true
    title?: true
    category?: true
    summary?: true
    details?: true
    keyPoints?: true
    examples?: true
    relatedConcepts?: true
    relationships?: true
    confidenceScore?: true
    lastUpdated?: true
    conversationId?: true
    _all?: true
  }

  export type ConceptAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Concept to aggregate.
     */
    where?: ConceptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Concepts to fetch.
     */
    orderBy?: ConceptOrderByWithRelationInput | ConceptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConceptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Concepts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Concepts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Concepts
    **/
    _count?: true | ConceptCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ConceptAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ConceptSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConceptMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConceptMaxAggregateInputType
  }

  export type GetConceptAggregateType<T extends ConceptAggregateArgs> = {
        [P in keyof T & keyof AggregateConcept]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConcept[P]>
      : GetScalarType<T[P], AggregateConcept[P]>
  }




  export type ConceptGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConceptWhereInput
    orderBy?: ConceptOrderByWithAggregationInput | ConceptOrderByWithAggregationInput[]
    by: ConceptScalarFieldEnum[] | ConceptScalarFieldEnum
    having?: ConceptScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConceptCountAggregateInputType | true
    _avg?: ConceptAvgAggregateInputType
    _sum?: ConceptSumAggregateInputType
    _min?: ConceptMinAggregateInputType
    _max?: ConceptMaxAggregateInputType
  }

  export type ConceptGroupByOutputType = {
    id: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date
    conversationId: string
    _count: ConceptCountAggregateOutputType | null
    _avg: ConceptAvgAggregateOutputType | null
    _sum: ConceptSumAggregateOutputType | null
    _min: ConceptMinAggregateOutputType | null
    _max: ConceptMaxAggregateOutputType | null
  }

  type GetConceptGroupByPayload<T extends ConceptGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConceptGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConceptGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConceptGroupByOutputType[P]>
            : GetScalarType<T[P], ConceptGroupByOutputType[P]>
        }
      >
    >


  export type ConceptSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    category?: boolean
    summary?: boolean
    details?: boolean
    keyPoints?: boolean
    examples?: boolean
    relatedConcepts?: boolean
    relationships?: boolean
    confidenceScore?: boolean
    lastUpdated?: boolean
    conversationId?: boolean
    codeSnippets?: boolean | Concept$codeSnippetsArgs<ExtArgs>
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    categories?: boolean | Concept$categoriesArgs<ExtArgs>
    occurrences?: boolean | Concept$occurrencesArgs<ExtArgs>
    _count?: boolean | ConceptCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["concept"]>

  export type ConceptSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    category?: boolean
    summary?: boolean
    details?: boolean
    keyPoints?: boolean
    examples?: boolean
    relatedConcepts?: boolean
    relationships?: boolean
    confidenceScore?: boolean
    lastUpdated?: boolean
    conversationId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["concept"]>

  export type ConceptSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    category?: boolean
    summary?: boolean
    details?: boolean
    keyPoints?: boolean
    examples?: boolean
    relatedConcepts?: boolean
    relationships?: boolean
    confidenceScore?: boolean
    lastUpdated?: boolean
    conversationId?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["concept"]>

  export type ConceptSelectScalar = {
    id?: boolean
    title?: boolean
    category?: boolean
    summary?: boolean
    details?: boolean
    keyPoints?: boolean
    examples?: boolean
    relatedConcepts?: boolean
    relationships?: boolean
    confidenceScore?: boolean
    lastUpdated?: boolean
    conversationId?: boolean
  }

  export type ConceptOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "category" | "summary" | "details" | "keyPoints" | "examples" | "relatedConcepts" | "relationships" | "confidenceScore" | "lastUpdated" | "conversationId", ExtArgs["result"]["concept"]>
  export type ConceptInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    codeSnippets?: boolean | Concept$codeSnippetsArgs<ExtArgs>
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    categories?: boolean | Concept$categoriesArgs<ExtArgs>
    occurrences?: boolean | Concept$occurrencesArgs<ExtArgs>
    _count?: boolean | ConceptCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ConceptIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }
  export type ConceptIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
  }

  export type $ConceptPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Concept"
    objects: {
      codeSnippets: Prisma.$CodeSnippetPayload<ExtArgs>[]
      conversation: Prisma.$ConversationPayload<ExtArgs>
      categories: Prisma.$CategoryPayload<ExtArgs>[]
      occurrences: Prisma.$OccurrencePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      category: string
      summary: string
      details: string
      keyPoints: string
      examples: string
      relatedConcepts: string
      relationships: string
      confidenceScore: number
      lastUpdated: Date
      conversationId: string
    }, ExtArgs["result"]["concept"]>
    composites: {}
  }

  type ConceptGetPayload<S extends boolean | null | undefined | ConceptDefaultArgs> = $Result.GetResult<Prisma.$ConceptPayload, S>

  type ConceptCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConceptFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConceptCountAggregateInputType | true
    }

  export interface ConceptDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Concept'], meta: { name: 'Concept' } }
    /**
     * Find zero or one Concept that matches the filter.
     * @param {ConceptFindUniqueArgs} args - Arguments to find a Concept
     * @example
     * // Get one Concept
     * const concept = await prisma.concept.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConceptFindUniqueArgs>(args: SelectSubset<T, ConceptFindUniqueArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Concept that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConceptFindUniqueOrThrowArgs} args - Arguments to find a Concept
     * @example
     * // Get one Concept
     * const concept = await prisma.concept.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConceptFindUniqueOrThrowArgs>(args: SelectSubset<T, ConceptFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Concept that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptFindFirstArgs} args - Arguments to find a Concept
     * @example
     * // Get one Concept
     * const concept = await prisma.concept.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConceptFindFirstArgs>(args?: SelectSubset<T, ConceptFindFirstArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Concept that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptFindFirstOrThrowArgs} args - Arguments to find a Concept
     * @example
     * // Get one Concept
     * const concept = await prisma.concept.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConceptFindFirstOrThrowArgs>(args?: SelectSubset<T, ConceptFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Concepts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Concepts
     * const concepts = await prisma.concept.findMany()
     * 
     * // Get first 10 Concepts
     * const concepts = await prisma.concept.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const conceptWithIdOnly = await prisma.concept.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConceptFindManyArgs>(args?: SelectSubset<T, ConceptFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Concept.
     * @param {ConceptCreateArgs} args - Arguments to create a Concept.
     * @example
     * // Create one Concept
     * const Concept = await prisma.concept.create({
     *   data: {
     *     // ... data to create a Concept
     *   }
     * })
     * 
     */
    create<T extends ConceptCreateArgs>(args: SelectSubset<T, ConceptCreateArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Concepts.
     * @param {ConceptCreateManyArgs} args - Arguments to create many Concepts.
     * @example
     * // Create many Concepts
     * const concept = await prisma.concept.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConceptCreateManyArgs>(args?: SelectSubset<T, ConceptCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Concepts and returns the data saved in the database.
     * @param {ConceptCreateManyAndReturnArgs} args - Arguments to create many Concepts.
     * @example
     * // Create many Concepts
     * const concept = await prisma.concept.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Concepts and only return the `id`
     * const conceptWithIdOnly = await prisma.concept.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConceptCreateManyAndReturnArgs>(args?: SelectSubset<T, ConceptCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Concept.
     * @param {ConceptDeleteArgs} args - Arguments to delete one Concept.
     * @example
     * // Delete one Concept
     * const Concept = await prisma.concept.delete({
     *   where: {
     *     // ... filter to delete one Concept
     *   }
     * })
     * 
     */
    delete<T extends ConceptDeleteArgs>(args: SelectSubset<T, ConceptDeleteArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Concept.
     * @param {ConceptUpdateArgs} args - Arguments to update one Concept.
     * @example
     * // Update one Concept
     * const concept = await prisma.concept.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConceptUpdateArgs>(args: SelectSubset<T, ConceptUpdateArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Concepts.
     * @param {ConceptDeleteManyArgs} args - Arguments to filter Concepts to delete.
     * @example
     * // Delete a few Concepts
     * const { count } = await prisma.concept.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConceptDeleteManyArgs>(args?: SelectSubset<T, ConceptDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Concepts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Concepts
     * const concept = await prisma.concept.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConceptUpdateManyArgs>(args: SelectSubset<T, ConceptUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Concepts and returns the data updated in the database.
     * @param {ConceptUpdateManyAndReturnArgs} args - Arguments to update many Concepts.
     * @example
     * // Update many Concepts
     * const concept = await prisma.concept.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Concepts and only return the `id`
     * const conceptWithIdOnly = await prisma.concept.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ConceptUpdateManyAndReturnArgs>(args: SelectSubset<T, ConceptUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Concept.
     * @param {ConceptUpsertArgs} args - Arguments to update or create a Concept.
     * @example
     * // Update or create a Concept
     * const concept = await prisma.concept.upsert({
     *   create: {
     *     // ... data to create a Concept
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Concept we want to update
     *   }
     * })
     */
    upsert<T extends ConceptUpsertArgs>(args: SelectSubset<T, ConceptUpsertArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Concepts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptCountArgs} args - Arguments to filter Concepts to count.
     * @example
     * // Count the number of Concepts
     * const count = await prisma.concept.count({
     *   where: {
     *     // ... the filter for the Concepts we want to count
     *   }
     * })
    **/
    count<T extends ConceptCountArgs>(
      args?: Subset<T, ConceptCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConceptCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Concept.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConceptAggregateArgs>(args: Subset<T, ConceptAggregateArgs>): Prisma.PrismaPromise<GetConceptAggregateType<T>>

    /**
     * Group by Concept.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConceptGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConceptGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConceptGroupByArgs['orderBy'] }
        : { orderBy?: ConceptGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConceptGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConceptGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Concept model
   */
  readonly fields: ConceptFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Concept.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConceptClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    codeSnippets<T extends Concept$codeSnippetsArgs<ExtArgs> = {}>(args?: Subset<T, Concept$codeSnippetsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    conversation<T extends ConversationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConversationDefaultArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    categories<T extends Concept$categoriesArgs<ExtArgs> = {}>(args?: Subset<T, Concept$categoriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    occurrences<T extends Concept$occurrencesArgs<ExtArgs> = {}>(args?: Subset<T, Concept$occurrencesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Concept model
   */
  interface ConceptFieldRefs {
    readonly id: FieldRef<"Concept", 'String'>
    readonly title: FieldRef<"Concept", 'String'>
    readonly category: FieldRef<"Concept", 'String'>
    readonly summary: FieldRef<"Concept", 'String'>
    readonly details: FieldRef<"Concept", 'String'>
    readonly keyPoints: FieldRef<"Concept", 'String'>
    readonly examples: FieldRef<"Concept", 'String'>
    readonly relatedConcepts: FieldRef<"Concept", 'String'>
    readonly relationships: FieldRef<"Concept", 'String'>
    readonly confidenceScore: FieldRef<"Concept", 'Float'>
    readonly lastUpdated: FieldRef<"Concept", 'DateTime'>
    readonly conversationId: FieldRef<"Concept", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Concept findUnique
   */
  export type ConceptFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter, which Concept to fetch.
     */
    where: ConceptWhereUniqueInput
  }

  /**
   * Concept findUniqueOrThrow
   */
  export type ConceptFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter, which Concept to fetch.
     */
    where: ConceptWhereUniqueInput
  }

  /**
   * Concept findFirst
   */
  export type ConceptFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter, which Concept to fetch.
     */
    where?: ConceptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Concepts to fetch.
     */
    orderBy?: ConceptOrderByWithRelationInput | ConceptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Concepts.
     */
    cursor?: ConceptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Concepts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Concepts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Concepts.
     */
    distinct?: ConceptScalarFieldEnum | ConceptScalarFieldEnum[]
  }

  /**
   * Concept findFirstOrThrow
   */
  export type ConceptFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter, which Concept to fetch.
     */
    where?: ConceptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Concepts to fetch.
     */
    orderBy?: ConceptOrderByWithRelationInput | ConceptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Concepts.
     */
    cursor?: ConceptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Concepts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Concepts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Concepts.
     */
    distinct?: ConceptScalarFieldEnum | ConceptScalarFieldEnum[]
  }

  /**
   * Concept findMany
   */
  export type ConceptFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter, which Concepts to fetch.
     */
    where?: ConceptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Concepts to fetch.
     */
    orderBy?: ConceptOrderByWithRelationInput | ConceptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Concepts.
     */
    cursor?: ConceptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Concepts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Concepts.
     */
    skip?: number
    distinct?: ConceptScalarFieldEnum | ConceptScalarFieldEnum[]
  }

  /**
   * Concept create
   */
  export type ConceptCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * The data needed to create a Concept.
     */
    data: XOR<ConceptCreateInput, ConceptUncheckedCreateInput>
  }

  /**
   * Concept createMany
   */
  export type ConceptCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Concepts.
     */
    data: ConceptCreateManyInput | ConceptCreateManyInput[]
  }

  /**
   * Concept createManyAndReturn
   */
  export type ConceptCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * The data used to create many Concepts.
     */
    data: ConceptCreateManyInput | ConceptCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Concept update
   */
  export type ConceptUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * The data needed to update a Concept.
     */
    data: XOR<ConceptUpdateInput, ConceptUncheckedUpdateInput>
    /**
     * Choose, which Concept to update.
     */
    where: ConceptWhereUniqueInput
  }

  /**
   * Concept updateMany
   */
  export type ConceptUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Concepts.
     */
    data: XOR<ConceptUpdateManyMutationInput, ConceptUncheckedUpdateManyInput>
    /**
     * Filter which Concepts to update
     */
    where?: ConceptWhereInput
    /**
     * Limit how many Concepts to update.
     */
    limit?: number
  }

  /**
   * Concept updateManyAndReturn
   */
  export type ConceptUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * The data used to update Concepts.
     */
    data: XOR<ConceptUpdateManyMutationInput, ConceptUncheckedUpdateManyInput>
    /**
     * Filter which Concepts to update
     */
    where?: ConceptWhereInput
    /**
     * Limit how many Concepts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Concept upsert
   */
  export type ConceptUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * The filter to search for the Concept to update in case it exists.
     */
    where: ConceptWhereUniqueInput
    /**
     * In case the Concept found by the `where` argument doesn't exist, create a new Concept with this data.
     */
    create: XOR<ConceptCreateInput, ConceptUncheckedCreateInput>
    /**
     * In case the Concept was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConceptUpdateInput, ConceptUncheckedUpdateInput>
  }

  /**
   * Concept delete
   */
  export type ConceptDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    /**
     * Filter which Concept to delete.
     */
    where: ConceptWhereUniqueInput
  }

  /**
   * Concept deleteMany
   */
  export type ConceptDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Concepts to delete
     */
    where?: ConceptWhereInput
    /**
     * Limit how many Concepts to delete.
     */
    limit?: number
  }

  /**
   * Concept.codeSnippets
   */
  export type Concept$codeSnippetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetInclude<ExtArgs> | null
    where?: CodeSnippetWhereInput
    orderBy?: CodeSnippetOrderByWithRelationInput | CodeSnippetOrderByWithRelationInput[]
    cursor?: CodeSnippetWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CodeSnippetScalarFieldEnum | CodeSnippetScalarFieldEnum[]
  }

  /**
   * Concept.categories
   */
  export type Concept$categoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    where?: CategoryWhereInput
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    cursor?: CategoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Concept.occurrences
   */
  export type Concept$occurrencesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
    where?: OccurrenceWhereInput
    orderBy?: OccurrenceOrderByWithRelationInput | OccurrenceOrderByWithRelationInput[]
    cursor?: OccurrenceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OccurrenceScalarFieldEnum | OccurrenceScalarFieldEnum[]
  }

  /**
   * Concept without action
   */
  export type ConceptDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
  }


  /**
   * Model Conversation
   */

  export type AggregateConversation = {
    _count: ConversationCountAggregateOutputType | null
    _min: ConversationMinAggregateOutputType | null
    _max: ConversationMaxAggregateOutputType | null
  }

  export type ConversationMinAggregateOutputType = {
    id: string | null
    text: string | null
    summary: string | null
    createdAt: Date | null
  }

  export type ConversationMaxAggregateOutputType = {
    id: string | null
    text: string | null
    summary: string | null
    createdAt: Date | null
  }

  export type ConversationCountAggregateOutputType = {
    id: number
    text: number
    summary: number
    createdAt: number
    _all: number
  }


  export type ConversationMinAggregateInputType = {
    id?: true
    text?: true
    summary?: true
    createdAt?: true
  }

  export type ConversationMaxAggregateInputType = {
    id?: true
    text?: true
    summary?: true
    createdAt?: true
  }

  export type ConversationCountAggregateInputType = {
    id?: true
    text?: true
    summary?: true
    createdAt?: true
    _all?: true
  }

  export type ConversationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Conversation to aggregate.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Conversations
    **/
    _count?: true | ConversationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConversationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConversationMaxAggregateInputType
  }

  export type GetConversationAggregateType<T extends ConversationAggregateArgs> = {
        [P in keyof T & keyof AggregateConversation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConversation[P]>
      : GetScalarType<T[P], AggregateConversation[P]>
  }




  export type ConversationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConversationWhereInput
    orderBy?: ConversationOrderByWithAggregationInput | ConversationOrderByWithAggregationInput[]
    by: ConversationScalarFieldEnum[] | ConversationScalarFieldEnum
    having?: ConversationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConversationCountAggregateInputType | true
    _min?: ConversationMinAggregateInputType
    _max?: ConversationMaxAggregateInputType
  }

  export type ConversationGroupByOutputType = {
    id: string
    text: string
    summary: string
    createdAt: Date
    _count: ConversationCountAggregateOutputType | null
    _min: ConversationMinAggregateOutputType | null
    _max: ConversationMaxAggregateOutputType | null
  }

  type GetConversationGroupByPayload<T extends ConversationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConversationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConversationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConversationGroupByOutputType[P]>
            : GetScalarType<T[P], ConversationGroupByOutputType[P]>
        }
      >
    >


  export type ConversationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    text?: boolean
    summary?: boolean
    createdAt?: boolean
    concepts?: boolean | Conversation$conceptsArgs<ExtArgs>
    occurrences?: boolean | Conversation$occurrencesArgs<ExtArgs>
    _count?: boolean | ConversationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["conversation"]>

  export type ConversationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    text?: boolean
    summary?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["conversation"]>

  export type ConversationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    text?: boolean
    summary?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["conversation"]>

  export type ConversationSelectScalar = {
    id?: boolean
    text?: boolean
    summary?: boolean
    createdAt?: boolean
  }

  export type ConversationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "text" | "summary" | "createdAt", ExtArgs["result"]["conversation"]>
  export type ConversationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    concepts?: boolean | Conversation$conceptsArgs<ExtArgs>
    occurrences?: boolean | Conversation$occurrencesArgs<ExtArgs>
    _count?: boolean | ConversationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ConversationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ConversationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ConversationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Conversation"
    objects: {
      concepts: Prisma.$ConceptPayload<ExtArgs>[]
      occurrences: Prisma.$OccurrencePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      text: string
      summary: string
      createdAt: Date
    }, ExtArgs["result"]["conversation"]>
    composites: {}
  }

  type ConversationGetPayload<S extends boolean | null | undefined | ConversationDefaultArgs> = $Result.GetResult<Prisma.$ConversationPayload, S>

  type ConversationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConversationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConversationCountAggregateInputType | true
    }

  export interface ConversationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Conversation'], meta: { name: 'Conversation' } }
    /**
     * Find zero or one Conversation that matches the filter.
     * @param {ConversationFindUniqueArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConversationFindUniqueArgs>(args: SelectSubset<T, ConversationFindUniqueArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Conversation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConversationFindUniqueOrThrowArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConversationFindUniqueOrThrowArgs>(args: SelectSubset<T, ConversationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Conversation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationFindFirstArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConversationFindFirstArgs>(args?: SelectSubset<T, ConversationFindFirstArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Conversation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationFindFirstOrThrowArgs} args - Arguments to find a Conversation
     * @example
     * // Get one Conversation
     * const conversation = await prisma.conversation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConversationFindFirstOrThrowArgs>(args?: SelectSubset<T, ConversationFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Conversations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Conversations
     * const conversations = await prisma.conversation.findMany()
     * 
     * // Get first 10 Conversations
     * const conversations = await prisma.conversation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const conversationWithIdOnly = await prisma.conversation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConversationFindManyArgs>(args?: SelectSubset<T, ConversationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Conversation.
     * @param {ConversationCreateArgs} args - Arguments to create a Conversation.
     * @example
     * // Create one Conversation
     * const Conversation = await prisma.conversation.create({
     *   data: {
     *     // ... data to create a Conversation
     *   }
     * })
     * 
     */
    create<T extends ConversationCreateArgs>(args: SelectSubset<T, ConversationCreateArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Conversations.
     * @param {ConversationCreateManyArgs} args - Arguments to create many Conversations.
     * @example
     * // Create many Conversations
     * const conversation = await prisma.conversation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConversationCreateManyArgs>(args?: SelectSubset<T, ConversationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Conversations and returns the data saved in the database.
     * @param {ConversationCreateManyAndReturnArgs} args - Arguments to create many Conversations.
     * @example
     * // Create many Conversations
     * const conversation = await prisma.conversation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Conversations and only return the `id`
     * const conversationWithIdOnly = await prisma.conversation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConversationCreateManyAndReturnArgs>(args?: SelectSubset<T, ConversationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Conversation.
     * @param {ConversationDeleteArgs} args - Arguments to delete one Conversation.
     * @example
     * // Delete one Conversation
     * const Conversation = await prisma.conversation.delete({
     *   where: {
     *     // ... filter to delete one Conversation
     *   }
     * })
     * 
     */
    delete<T extends ConversationDeleteArgs>(args: SelectSubset<T, ConversationDeleteArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Conversation.
     * @param {ConversationUpdateArgs} args - Arguments to update one Conversation.
     * @example
     * // Update one Conversation
     * const conversation = await prisma.conversation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConversationUpdateArgs>(args: SelectSubset<T, ConversationUpdateArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Conversations.
     * @param {ConversationDeleteManyArgs} args - Arguments to filter Conversations to delete.
     * @example
     * // Delete a few Conversations
     * const { count } = await prisma.conversation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConversationDeleteManyArgs>(args?: SelectSubset<T, ConversationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Conversations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Conversations
     * const conversation = await prisma.conversation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConversationUpdateManyArgs>(args: SelectSubset<T, ConversationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Conversations and returns the data updated in the database.
     * @param {ConversationUpdateManyAndReturnArgs} args - Arguments to update many Conversations.
     * @example
     * // Update many Conversations
     * const conversation = await prisma.conversation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Conversations and only return the `id`
     * const conversationWithIdOnly = await prisma.conversation.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ConversationUpdateManyAndReturnArgs>(args: SelectSubset<T, ConversationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Conversation.
     * @param {ConversationUpsertArgs} args - Arguments to update or create a Conversation.
     * @example
     * // Update or create a Conversation
     * const conversation = await prisma.conversation.upsert({
     *   create: {
     *     // ... data to create a Conversation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Conversation we want to update
     *   }
     * })
     */
    upsert<T extends ConversationUpsertArgs>(args: SelectSubset<T, ConversationUpsertArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Conversations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationCountArgs} args - Arguments to filter Conversations to count.
     * @example
     * // Count the number of Conversations
     * const count = await prisma.conversation.count({
     *   where: {
     *     // ... the filter for the Conversations we want to count
     *   }
     * })
    **/
    count<T extends ConversationCountArgs>(
      args?: Subset<T, ConversationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConversationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Conversation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConversationAggregateArgs>(args: Subset<T, ConversationAggregateArgs>): Prisma.PrismaPromise<GetConversationAggregateType<T>>

    /**
     * Group by Conversation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConversationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConversationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConversationGroupByArgs['orderBy'] }
        : { orderBy?: ConversationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConversationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConversationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Conversation model
   */
  readonly fields: ConversationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Conversation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConversationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    concepts<T extends Conversation$conceptsArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$conceptsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    occurrences<T extends Conversation$occurrencesArgs<ExtArgs> = {}>(args?: Subset<T, Conversation$occurrencesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Conversation model
   */
  interface ConversationFieldRefs {
    readonly id: FieldRef<"Conversation", 'String'>
    readonly text: FieldRef<"Conversation", 'String'>
    readonly summary: FieldRef<"Conversation", 'String'>
    readonly createdAt: FieldRef<"Conversation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Conversation findUnique
   */
  export type ConversationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation findUniqueOrThrow
   */
  export type ConversationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation findFirst
   */
  export type ConversationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Conversations.
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Conversations.
     */
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Conversation findFirstOrThrow
   */
  export type ConversationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversation to fetch.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Conversations.
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Conversations.
     */
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Conversation findMany
   */
  export type ConversationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter, which Conversations to fetch.
     */
    where?: ConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Conversations to fetch.
     */
    orderBy?: ConversationOrderByWithRelationInput | ConversationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Conversations.
     */
    cursor?: ConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Conversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Conversations.
     */
    skip?: number
    distinct?: ConversationScalarFieldEnum | ConversationScalarFieldEnum[]
  }

  /**
   * Conversation create
   */
  export type ConversationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * The data needed to create a Conversation.
     */
    data: XOR<ConversationCreateInput, ConversationUncheckedCreateInput>
  }

  /**
   * Conversation createMany
   */
  export type ConversationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Conversations.
     */
    data: ConversationCreateManyInput | ConversationCreateManyInput[]
  }

  /**
   * Conversation createManyAndReturn
   */
  export type ConversationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * The data used to create many Conversations.
     */
    data: ConversationCreateManyInput | ConversationCreateManyInput[]
  }

  /**
   * Conversation update
   */
  export type ConversationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * The data needed to update a Conversation.
     */
    data: XOR<ConversationUpdateInput, ConversationUncheckedUpdateInput>
    /**
     * Choose, which Conversation to update.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation updateMany
   */
  export type ConversationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Conversations.
     */
    data: XOR<ConversationUpdateManyMutationInput, ConversationUncheckedUpdateManyInput>
    /**
     * Filter which Conversations to update
     */
    where?: ConversationWhereInput
    /**
     * Limit how many Conversations to update.
     */
    limit?: number
  }

  /**
   * Conversation updateManyAndReturn
   */
  export type ConversationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * The data used to update Conversations.
     */
    data: XOR<ConversationUpdateManyMutationInput, ConversationUncheckedUpdateManyInput>
    /**
     * Filter which Conversations to update
     */
    where?: ConversationWhereInput
    /**
     * Limit how many Conversations to update.
     */
    limit?: number
  }

  /**
   * Conversation upsert
   */
  export type ConversationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * The filter to search for the Conversation to update in case it exists.
     */
    where: ConversationWhereUniqueInput
    /**
     * In case the Conversation found by the `where` argument doesn't exist, create a new Conversation with this data.
     */
    create: XOR<ConversationCreateInput, ConversationUncheckedCreateInput>
    /**
     * In case the Conversation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConversationUpdateInput, ConversationUncheckedUpdateInput>
  }

  /**
   * Conversation delete
   */
  export type ConversationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
    /**
     * Filter which Conversation to delete.
     */
    where: ConversationWhereUniqueInput
  }

  /**
   * Conversation deleteMany
   */
  export type ConversationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Conversations to delete
     */
    where?: ConversationWhereInput
    /**
     * Limit how many Conversations to delete.
     */
    limit?: number
  }

  /**
   * Conversation.concepts
   */
  export type Conversation$conceptsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Concept
     */
    select?: ConceptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Concept
     */
    omit?: ConceptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConceptInclude<ExtArgs> | null
    where?: ConceptWhereInput
    orderBy?: ConceptOrderByWithRelationInput | ConceptOrderByWithRelationInput[]
    cursor?: ConceptWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConceptScalarFieldEnum | ConceptScalarFieldEnum[]
  }

  /**
   * Conversation.occurrences
   */
  export type Conversation$occurrencesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
    where?: OccurrenceWhereInput
    orderBy?: OccurrenceOrderByWithRelationInput | OccurrenceOrderByWithRelationInput[]
    cursor?: OccurrenceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OccurrenceScalarFieldEnum | OccurrenceScalarFieldEnum[]
  }

  /**
   * Conversation without action
   */
  export type ConversationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Conversation
     */
    select?: ConversationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Conversation
     */
    omit?: ConversationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConversationInclude<ExtArgs> | null
  }


  /**
   * Model Occurrence
   */

  export type AggregateOccurrence = {
    _count: OccurrenceCountAggregateOutputType | null
    _min: OccurrenceMinAggregateOutputType | null
    _max: OccurrenceMaxAggregateOutputType | null
  }

  export type OccurrenceMinAggregateOutputType = {
    id: string | null
    conversationId: string | null
    conceptId: string | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type OccurrenceMaxAggregateOutputType = {
    id: string | null
    conversationId: string | null
    conceptId: string | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type OccurrenceCountAggregateOutputType = {
    id: number
    conversationId: number
    conceptId: number
    notes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type OccurrenceMinAggregateInputType = {
    id?: true
    conversationId?: true
    conceptId?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type OccurrenceMaxAggregateInputType = {
    id?: true
    conversationId?: true
    conceptId?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type OccurrenceCountAggregateInputType = {
    id?: true
    conversationId?: true
    conceptId?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type OccurrenceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Occurrence to aggregate.
     */
    where?: OccurrenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Occurrences to fetch.
     */
    orderBy?: OccurrenceOrderByWithRelationInput | OccurrenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OccurrenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Occurrences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Occurrences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Occurrences
    **/
    _count?: true | OccurrenceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OccurrenceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OccurrenceMaxAggregateInputType
  }

  export type GetOccurrenceAggregateType<T extends OccurrenceAggregateArgs> = {
        [P in keyof T & keyof AggregateOccurrence]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOccurrence[P]>
      : GetScalarType<T[P], AggregateOccurrence[P]>
  }




  export type OccurrenceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OccurrenceWhereInput
    orderBy?: OccurrenceOrderByWithAggregationInput | OccurrenceOrderByWithAggregationInput[]
    by: OccurrenceScalarFieldEnum[] | OccurrenceScalarFieldEnum
    having?: OccurrenceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OccurrenceCountAggregateInputType | true
    _min?: OccurrenceMinAggregateInputType
    _max?: OccurrenceMaxAggregateInputType
  }

  export type OccurrenceGroupByOutputType = {
    id: string
    conversationId: string
    conceptId: string
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: OccurrenceCountAggregateOutputType | null
    _min: OccurrenceMinAggregateOutputType | null
    _max: OccurrenceMaxAggregateOutputType | null
  }

  type GetOccurrenceGroupByPayload<T extends OccurrenceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OccurrenceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OccurrenceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OccurrenceGroupByOutputType[P]>
            : GetScalarType<T[P], OccurrenceGroupByOutputType[P]>
        }
      >
    >


  export type OccurrenceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    conversationId?: boolean
    conceptId?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["occurrence"]>

  export type OccurrenceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    conversationId?: boolean
    conceptId?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["occurrence"]>

  export type OccurrenceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    conversationId?: boolean
    conceptId?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["occurrence"]>

  export type OccurrenceSelectScalar = {
    id?: boolean
    conversationId?: boolean
    conceptId?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type OccurrenceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "conversationId" | "conceptId" | "notes" | "createdAt" | "updatedAt", ExtArgs["result"]["occurrence"]>
  export type OccurrenceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }
  export type OccurrenceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }
  export type OccurrenceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    conversation?: boolean | ConversationDefaultArgs<ExtArgs>
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }

  export type $OccurrencePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Occurrence"
    objects: {
      conversation: Prisma.$ConversationPayload<ExtArgs>
      concept: Prisma.$ConceptPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      conversationId: string
      conceptId: string
      notes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["occurrence"]>
    composites: {}
  }

  type OccurrenceGetPayload<S extends boolean | null | undefined | OccurrenceDefaultArgs> = $Result.GetResult<Prisma.$OccurrencePayload, S>

  type OccurrenceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OccurrenceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OccurrenceCountAggregateInputType | true
    }

  export interface OccurrenceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Occurrence'], meta: { name: 'Occurrence' } }
    /**
     * Find zero or one Occurrence that matches the filter.
     * @param {OccurrenceFindUniqueArgs} args - Arguments to find a Occurrence
     * @example
     * // Get one Occurrence
     * const occurrence = await prisma.occurrence.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OccurrenceFindUniqueArgs>(args: SelectSubset<T, OccurrenceFindUniqueArgs<ExtArgs>>): Prisma__OccurrenceClient<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Occurrence that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OccurrenceFindUniqueOrThrowArgs} args - Arguments to find a Occurrence
     * @example
     * // Get one Occurrence
     * const occurrence = await prisma.occurrence.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OccurrenceFindUniqueOrThrowArgs>(args: SelectSubset<T, OccurrenceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OccurrenceClient<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Occurrence that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccurrenceFindFirstArgs} args - Arguments to find a Occurrence
     * @example
     * // Get one Occurrence
     * const occurrence = await prisma.occurrence.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OccurrenceFindFirstArgs>(args?: SelectSubset<T, OccurrenceFindFirstArgs<ExtArgs>>): Prisma__OccurrenceClient<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Occurrence that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccurrenceFindFirstOrThrowArgs} args - Arguments to find a Occurrence
     * @example
     * // Get one Occurrence
     * const occurrence = await prisma.occurrence.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OccurrenceFindFirstOrThrowArgs>(args?: SelectSubset<T, OccurrenceFindFirstOrThrowArgs<ExtArgs>>): Prisma__OccurrenceClient<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Occurrences that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccurrenceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Occurrences
     * const occurrences = await prisma.occurrence.findMany()
     * 
     * // Get first 10 Occurrences
     * const occurrences = await prisma.occurrence.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const occurrenceWithIdOnly = await prisma.occurrence.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OccurrenceFindManyArgs>(args?: SelectSubset<T, OccurrenceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Occurrence.
     * @param {OccurrenceCreateArgs} args - Arguments to create a Occurrence.
     * @example
     * // Create one Occurrence
     * const Occurrence = await prisma.occurrence.create({
     *   data: {
     *     // ... data to create a Occurrence
     *   }
     * })
     * 
     */
    create<T extends OccurrenceCreateArgs>(args: SelectSubset<T, OccurrenceCreateArgs<ExtArgs>>): Prisma__OccurrenceClient<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Occurrences.
     * @param {OccurrenceCreateManyArgs} args - Arguments to create many Occurrences.
     * @example
     * // Create many Occurrences
     * const occurrence = await prisma.occurrence.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OccurrenceCreateManyArgs>(args?: SelectSubset<T, OccurrenceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Occurrences and returns the data saved in the database.
     * @param {OccurrenceCreateManyAndReturnArgs} args - Arguments to create many Occurrences.
     * @example
     * // Create many Occurrences
     * const occurrence = await prisma.occurrence.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Occurrences and only return the `id`
     * const occurrenceWithIdOnly = await prisma.occurrence.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OccurrenceCreateManyAndReturnArgs>(args?: SelectSubset<T, OccurrenceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Occurrence.
     * @param {OccurrenceDeleteArgs} args - Arguments to delete one Occurrence.
     * @example
     * // Delete one Occurrence
     * const Occurrence = await prisma.occurrence.delete({
     *   where: {
     *     // ... filter to delete one Occurrence
     *   }
     * })
     * 
     */
    delete<T extends OccurrenceDeleteArgs>(args: SelectSubset<T, OccurrenceDeleteArgs<ExtArgs>>): Prisma__OccurrenceClient<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Occurrence.
     * @param {OccurrenceUpdateArgs} args - Arguments to update one Occurrence.
     * @example
     * // Update one Occurrence
     * const occurrence = await prisma.occurrence.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OccurrenceUpdateArgs>(args: SelectSubset<T, OccurrenceUpdateArgs<ExtArgs>>): Prisma__OccurrenceClient<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Occurrences.
     * @param {OccurrenceDeleteManyArgs} args - Arguments to filter Occurrences to delete.
     * @example
     * // Delete a few Occurrences
     * const { count } = await prisma.occurrence.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OccurrenceDeleteManyArgs>(args?: SelectSubset<T, OccurrenceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Occurrences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccurrenceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Occurrences
     * const occurrence = await prisma.occurrence.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OccurrenceUpdateManyArgs>(args: SelectSubset<T, OccurrenceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Occurrences and returns the data updated in the database.
     * @param {OccurrenceUpdateManyAndReturnArgs} args - Arguments to update many Occurrences.
     * @example
     * // Update many Occurrences
     * const occurrence = await prisma.occurrence.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Occurrences and only return the `id`
     * const occurrenceWithIdOnly = await prisma.occurrence.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends OccurrenceUpdateManyAndReturnArgs>(args: SelectSubset<T, OccurrenceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Occurrence.
     * @param {OccurrenceUpsertArgs} args - Arguments to update or create a Occurrence.
     * @example
     * // Update or create a Occurrence
     * const occurrence = await prisma.occurrence.upsert({
     *   create: {
     *     // ... data to create a Occurrence
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Occurrence we want to update
     *   }
     * })
     */
    upsert<T extends OccurrenceUpsertArgs>(args: SelectSubset<T, OccurrenceUpsertArgs<ExtArgs>>): Prisma__OccurrenceClient<$Result.GetResult<Prisma.$OccurrencePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Occurrences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccurrenceCountArgs} args - Arguments to filter Occurrences to count.
     * @example
     * // Count the number of Occurrences
     * const count = await prisma.occurrence.count({
     *   where: {
     *     // ... the filter for the Occurrences we want to count
     *   }
     * })
    **/
    count<T extends OccurrenceCountArgs>(
      args?: Subset<T, OccurrenceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OccurrenceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Occurrence.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccurrenceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OccurrenceAggregateArgs>(args: Subset<T, OccurrenceAggregateArgs>): Prisma.PrismaPromise<GetOccurrenceAggregateType<T>>

    /**
     * Group by Occurrence.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccurrenceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OccurrenceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OccurrenceGroupByArgs['orderBy'] }
        : { orderBy?: OccurrenceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OccurrenceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOccurrenceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Occurrence model
   */
  readonly fields: OccurrenceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Occurrence.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OccurrenceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    conversation<T extends ConversationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConversationDefaultArgs<ExtArgs>>): Prisma__ConversationClient<$Result.GetResult<Prisma.$ConversationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    concept<T extends ConceptDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConceptDefaultArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Occurrence model
   */
  interface OccurrenceFieldRefs {
    readonly id: FieldRef<"Occurrence", 'String'>
    readonly conversationId: FieldRef<"Occurrence", 'String'>
    readonly conceptId: FieldRef<"Occurrence", 'String'>
    readonly notes: FieldRef<"Occurrence", 'String'>
    readonly createdAt: FieldRef<"Occurrence", 'DateTime'>
    readonly updatedAt: FieldRef<"Occurrence", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Occurrence findUnique
   */
  export type OccurrenceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
    /**
     * Filter, which Occurrence to fetch.
     */
    where: OccurrenceWhereUniqueInput
  }

  /**
   * Occurrence findUniqueOrThrow
   */
  export type OccurrenceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
    /**
     * Filter, which Occurrence to fetch.
     */
    where: OccurrenceWhereUniqueInput
  }

  /**
   * Occurrence findFirst
   */
  export type OccurrenceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
    /**
     * Filter, which Occurrence to fetch.
     */
    where?: OccurrenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Occurrences to fetch.
     */
    orderBy?: OccurrenceOrderByWithRelationInput | OccurrenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Occurrences.
     */
    cursor?: OccurrenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Occurrences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Occurrences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Occurrences.
     */
    distinct?: OccurrenceScalarFieldEnum | OccurrenceScalarFieldEnum[]
  }

  /**
   * Occurrence findFirstOrThrow
   */
  export type OccurrenceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
    /**
     * Filter, which Occurrence to fetch.
     */
    where?: OccurrenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Occurrences to fetch.
     */
    orderBy?: OccurrenceOrderByWithRelationInput | OccurrenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Occurrences.
     */
    cursor?: OccurrenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Occurrences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Occurrences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Occurrences.
     */
    distinct?: OccurrenceScalarFieldEnum | OccurrenceScalarFieldEnum[]
  }

  /**
   * Occurrence findMany
   */
  export type OccurrenceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
    /**
     * Filter, which Occurrences to fetch.
     */
    where?: OccurrenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Occurrences to fetch.
     */
    orderBy?: OccurrenceOrderByWithRelationInput | OccurrenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Occurrences.
     */
    cursor?: OccurrenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Occurrences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Occurrences.
     */
    skip?: number
    distinct?: OccurrenceScalarFieldEnum | OccurrenceScalarFieldEnum[]
  }

  /**
   * Occurrence create
   */
  export type OccurrenceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
    /**
     * The data needed to create a Occurrence.
     */
    data: XOR<OccurrenceCreateInput, OccurrenceUncheckedCreateInput>
  }

  /**
   * Occurrence createMany
   */
  export type OccurrenceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Occurrences.
     */
    data: OccurrenceCreateManyInput | OccurrenceCreateManyInput[]
  }

  /**
   * Occurrence createManyAndReturn
   */
  export type OccurrenceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * The data used to create many Occurrences.
     */
    data: OccurrenceCreateManyInput | OccurrenceCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Occurrence update
   */
  export type OccurrenceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
    /**
     * The data needed to update a Occurrence.
     */
    data: XOR<OccurrenceUpdateInput, OccurrenceUncheckedUpdateInput>
    /**
     * Choose, which Occurrence to update.
     */
    where: OccurrenceWhereUniqueInput
  }

  /**
   * Occurrence updateMany
   */
  export type OccurrenceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Occurrences.
     */
    data: XOR<OccurrenceUpdateManyMutationInput, OccurrenceUncheckedUpdateManyInput>
    /**
     * Filter which Occurrences to update
     */
    where?: OccurrenceWhereInput
    /**
     * Limit how many Occurrences to update.
     */
    limit?: number
  }

  /**
   * Occurrence updateManyAndReturn
   */
  export type OccurrenceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * The data used to update Occurrences.
     */
    data: XOR<OccurrenceUpdateManyMutationInput, OccurrenceUncheckedUpdateManyInput>
    /**
     * Filter which Occurrences to update
     */
    where?: OccurrenceWhereInput
    /**
     * Limit how many Occurrences to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Occurrence upsert
   */
  export type OccurrenceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
    /**
     * The filter to search for the Occurrence to update in case it exists.
     */
    where: OccurrenceWhereUniqueInput
    /**
     * In case the Occurrence found by the `where` argument doesn't exist, create a new Occurrence with this data.
     */
    create: XOR<OccurrenceCreateInput, OccurrenceUncheckedCreateInput>
    /**
     * In case the Occurrence was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OccurrenceUpdateInput, OccurrenceUncheckedUpdateInput>
  }

  /**
   * Occurrence delete
   */
  export type OccurrenceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
    /**
     * Filter which Occurrence to delete.
     */
    where: OccurrenceWhereUniqueInput
  }

  /**
   * Occurrence deleteMany
   */
  export type OccurrenceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Occurrences to delete
     */
    where?: OccurrenceWhereInput
    /**
     * Limit how many Occurrences to delete.
     */
    limit?: number
  }

  /**
   * Occurrence without action
   */
  export type OccurrenceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Occurrence
     */
    select?: OccurrenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Occurrence
     */
    omit?: OccurrenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccurrenceInclude<ExtArgs> | null
  }


  /**
   * Model CodeSnippet
   */

  export type AggregateCodeSnippet = {
    _count: CodeSnippetCountAggregateOutputType | null
    _min: CodeSnippetMinAggregateOutputType | null
    _max: CodeSnippetMaxAggregateOutputType | null
  }

  export type CodeSnippetMinAggregateOutputType = {
    id: string | null
    language: string | null
    description: string | null
    code: string | null
    conceptId: string | null
  }

  export type CodeSnippetMaxAggregateOutputType = {
    id: string | null
    language: string | null
    description: string | null
    code: string | null
    conceptId: string | null
  }

  export type CodeSnippetCountAggregateOutputType = {
    id: number
    language: number
    description: number
    code: number
    conceptId: number
    _all: number
  }


  export type CodeSnippetMinAggregateInputType = {
    id?: true
    language?: true
    description?: true
    code?: true
    conceptId?: true
  }

  export type CodeSnippetMaxAggregateInputType = {
    id?: true
    language?: true
    description?: true
    code?: true
    conceptId?: true
  }

  export type CodeSnippetCountAggregateInputType = {
    id?: true
    language?: true
    description?: true
    code?: true
    conceptId?: true
    _all?: true
  }

  export type CodeSnippetAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CodeSnippet to aggregate.
     */
    where?: CodeSnippetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CodeSnippets to fetch.
     */
    orderBy?: CodeSnippetOrderByWithRelationInput | CodeSnippetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CodeSnippetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CodeSnippets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CodeSnippets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CodeSnippets
    **/
    _count?: true | CodeSnippetCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CodeSnippetMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CodeSnippetMaxAggregateInputType
  }

  export type GetCodeSnippetAggregateType<T extends CodeSnippetAggregateArgs> = {
        [P in keyof T & keyof AggregateCodeSnippet]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCodeSnippet[P]>
      : GetScalarType<T[P], AggregateCodeSnippet[P]>
  }




  export type CodeSnippetGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CodeSnippetWhereInput
    orderBy?: CodeSnippetOrderByWithAggregationInput | CodeSnippetOrderByWithAggregationInput[]
    by: CodeSnippetScalarFieldEnum[] | CodeSnippetScalarFieldEnum
    having?: CodeSnippetScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CodeSnippetCountAggregateInputType | true
    _min?: CodeSnippetMinAggregateInputType
    _max?: CodeSnippetMaxAggregateInputType
  }

  export type CodeSnippetGroupByOutputType = {
    id: string
    language: string
    description: string
    code: string
    conceptId: string
    _count: CodeSnippetCountAggregateOutputType | null
    _min: CodeSnippetMinAggregateOutputType | null
    _max: CodeSnippetMaxAggregateOutputType | null
  }

  type GetCodeSnippetGroupByPayload<T extends CodeSnippetGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CodeSnippetGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CodeSnippetGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CodeSnippetGroupByOutputType[P]>
            : GetScalarType<T[P], CodeSnippetGroupByOutputType[P]>
        }
      >
    >


  export type CodeSnippetSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    language?: boolean
    description?: boolean
    code?: boolean
    conceptId?: boolean
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["codeSnippet"]>

  export type CodeSnippetSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    language?: boolean
    description?: boolean
    code?: boolean
    conceptId?: boolean
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["codeSnippet"]>

  export type CodeSnippetSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    language?: boolean
    description?: boolean
    code?: boolean
    conceptId?: boolean
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["codeSnippet"]>

  export type CodeSnippetSelectScalar = {
    id?: boolean
    language?: boolean
    description?: boolean
    code?: boolean
    conceptId?: boolean
  }

  export type CodeSnippetOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "language" | "description" | "code" | "conceptId", ExtArgs["result"]["codeSnippet"]>
  export type CodeSnippetInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }
  export type CodeSnippetIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }
  export type CodeSnippetIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    concept?: boolean | ConceptDefaultArgs<ExtArgs>
  }

  export type $CodeSnippetPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CodeSnippet"
    objects: {
      concept: Prisma.$ConceptPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      language: string
      description: string
      code: string
      conceptId: string
    }, ExtArgs["result"]["codeSnippet"]>
    composites: {}
  }

  type CodeSnippetGetPayload<S extends boolean | null | undefined | CodeSnippetDefaultArgs> = $Result.GetResult<Prisma.$CodeSnippetPayload, S>

  type CodeSnippetCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CodeSnippetFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CodeSnippetCountAggregateInputType | true
    }

  export interface CodeSnippetDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CodeSnippet'], meta: { name: 'CodeSnippet' } }
    /**
     * Find zero or one CodeSnippet that matches the filter.
     * @param {CodeSnippetFindUniqueArgs} args - Arguments to find a CodeSnippet
     * @example
     * // Get one CodeSnippet
     * const codeSnippet = await prisma.codeSnippet.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CodeSnippetFindUniqueArgs>(args: SelectSubset<T, CodeSnippetFindUniqueArgs<ExtArgs>>): Prisma__CodeSnippetClient<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CodeSnippet that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CodeSnippetFindUniqueOrThrowArgs} args - Arguments to find a CodeSnippet
     * @example
     * // Get one CodeSnippet
     * const codeSnippet = await prisma.codeSnippet.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CodeSnippetFindUniqueOrThrowArgs>(args: SelectSubset<T, CodeSnippetFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CodeSnippetClient<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CodeSnippet that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CodeSnippetFindFirstArgs} args - Arguments to find a CodeSnippet
     * @example
     * // Get one CodeSnippet
     * const codeSnippet = await prisma.codeSnippet.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CodeSnippetFindFirstArgs>(args?: SelectSubset<T, CodeSnippetFindFirstArgs<ExtArgs>>): Prisma__CodeSnippetClient<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CodeSnippet that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CodeSnippetFindFirstOrThrowArgs} args - Arguments to find a CodeSnippet
     * @example
     * // Get one CodeSnippet
     * const codeSnippet = await prisma.codeSnippet.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CodeSnippetFindFirstOrThrowArgs>(args?: SelectSubset<T, CodeSnippetFindFirstOrThrowArgs<ExtArgs>>): Prisma__CodeSnippetClient<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CodeSnippets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CodeSnippetFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CodeSnippets
     * const codeSnippets = await prisma.codeSnippet.findMany()
     * 
     * // Get first 10 CodeSnippets
     * const codeSnippets = await prisma.codeSnippet.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const codeSnippetWithIdOnly = await prisma.codeSnippet.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CodeSnippetFindManyArgs>(args?: SelectSubset<T, CodeSnippetFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CodeSnippet.
     * @param {CodeSnippetCreateArgs} args - Arguments to create a CodeSnippet.
     * @example
     * // Create one CodeSnippet
     * const CodeSnippet = await prisma.codeSnippet.create({
     *   data: {
     *     // ... data to create a CodeSnippet
     *   }
     * })
     * 
     */
    create<T extends CodeSnippetCreateArgs>(args: SelectSubset<T, CodeSnippetCreateArgs<ExtArgs>>): Prisma__CodeSnippetClient<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CodeSnippets.
     * @param {CodeSnippetCreateManyArgs} args - Arguments to create many CodeSnippets.
     * @example
     * // Create many CodeSnippets
     * const codeSnippet = await prisma.codeSnippet.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CodeSnippetCreateManyArgs>(args?: SelectSubset<T, CodeSnippetCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CodeSnippets and returns the data saved in the database.
     * @param {CodeSnippetCreateManyAndReturnArgs} args - Arguments to create many CodeSnippets.
     * @example
     * // Create many CodeSnippets
     * const codeSnippet = await prisma.codeSnippet.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CodeSnippets and only return the `id`
     * const codeSnippetWithIdOnly = await prisma.codeSnippet.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CodeSnippetCreateManyAndReturnArgs>(args?: SelectSubset<T, CodeSnippetCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CodeSnippet.
     * @param {CodeSnippetDeleteArgs} args - Arguments to delete one CodeSnippet.
     * @example
     * // Delete one CodeSnippet
     * const CodeSnippet = await prisma.codeSnippet.delete({
     *   where: {
     *     // ... filter to delete one CodeSnippet
     *   }
     * })
     * 
     */
    delete<T extends CodeSnippetDeleteArgs>(args: SelectSubset<T, CodeSnippetDeleteArgs<ExtArgs>>): Prisma__CodeSnippetClient<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CodeSnippet.
     * @param {CodeSnippetUpdateArgs} args - Arguments to update one CodeSnippet.
     * @example
     * // Update one CodeSnippet
     * const codeSnippet = await prisma.codeSnippet.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CodeSnippetUpdateArgs>(args: SelectSubset<T, CodeSnippetUpdateArgs<ExtArgs>>): Prisma__CodeSnippetClient<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CodeSnippets.
     * @param {CodeSnippetDeleteManyArgs} args - Arguments to filter CodeSnippets to delete.
     * @example
     * // Delete a few CodeSnippets
     * const { count } = await prisma.codeSnippet.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CodeSnippetDeleteManyArgs>(args?: SelectSubset<T, CodeSnippetDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CodeSnippets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CodeSnippetUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CodeSnippets
     * const codeSnippet = await prisma.codeSnippet.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CodeSnippetUpdateManyArgs>(args: SelectSubset<T, CodeSnippetUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CodeSnippets and returns the data updated in the database.
     * @param {CodeSnippetUpdateManyAndReturnArgs} args - Arguments to update many CodeSnippets.
     * @example
     * // Update many CodeSnippets
     * const codeSnippet = await prisma.codeSnippet.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CodeSnippets and only return the `id`
     * const codeSnippetWithIdOnly = await prisma.codeSnippet.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CodeSnippetUpdateManyAndReturnArgs>(args: SelectSubset<T, CodeSnippetUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CodeSnippet.
     * @param {CodeSnippetUpsertArgs} args - Arguments to update or create a CodeSnippet.
     * @example
     * // Update or create a CodeSnippet
     * const codeSnippet = await prisma.codeSnippet.upsert({
     *   create: {
     *     // ... data to create a CodeSnippet
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CodeSnippet we want to update
     *   }
     * })
     */
    upsert<T extends CodeSnippetUpsertArgs>(args: SelectSubset<T, CodeSnippetUpsertArgs<ExtArgs>>): Prisma__CodeSnippetClient<$Result.GetResult<Prisma.$CodeSnippetPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CodeSnippets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CodeSnippetCountArgs} args - Arguments to filter CodeSnippets to count.
     * @example
     * // Count the number of CodeSnippets
     * const count = await prisma.codeSnippet.count({
     *   where: {
     *     // ... the filter for the CodeSnippets we want to count
     *   }
     * })
    **/
    count<T extends CodeSnippetCountArgs>(
      args?: Subset<T, CodeSnippetCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CodeSnippetCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CodeSnippet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CodeSnippetAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CodeSnippetAggregateArgs>(args: Subset<T, CodeSnippetAggregateArgs>): Prisma.PrismaPromise<GetCodeSnippetAggregateType<T>>

    /**
     * Group by CodeSnippet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CodeSnippetGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CodeSnippetGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CodeSnippetGroupByArgs['orderBy'] }
        : { orderBy?: CodeSnippetGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CodeSnippetGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCodeSnippetGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CodeSnippet model
   */
  readonly fields: CodeSnippetFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CodeSnippet.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CodeSnippetClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    concept<T extends ConceptDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConceptDefaultArgs<ExtArgs>>): Prisma__ConceptClient<$Result.GetResult<Prisma.$ConceptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CodeSnippet model
   */
  interface CodeSnippetFieldRefs {
    readonly id: FieldRef<"CodeSnippet", 'String'>
    readonly language: FieldRef<"CodeSnippet", 'String'>
    readonly description: FieldRef<"CodeSnippet", 'String'>
    readonly code: FieldRef<"CodeSnippet", 'String'>
    readonly conceptId: FieldRef<"CodeSnippet", 'String'>
  }
    

  // Custom InputTypes
  /**
   * CodeSnippet findUnique
   */
  export type CodeSnippetFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetInclude<ExtArgs> | null
    /**
     * Filter, which CodeSnippet to fetch.
     */
    where: CodeSnippetWhereUniqueInput
  }

  /**
   * CodeSnippet findUniqueOrThrow
   */
  export type CodeSnippetFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetInclude<ExtArgs> | null
    /**
     * Filter, which CodeSnippet to fetch.
     */
    where: CodeSnippetWhereUniqueInput
  }

  /**
   * CodeSnippet findFirst
   */
  export type CodeSnippetFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetInclude<ExtArgs> | null
    /**
     * Filter, which CodeSnippet to fetch.
     */
    where?: CodeSnippetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CodeSnippets to fetch.
     */
    orderBy?: CodeSnippetOrderByWithRelationInput | CodeSnippetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CodeSnippets.
     */
    cursor?: CodeSnippetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CodeSnippets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CodeSnippets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CodeSnippets.
     */
    distinct?: CodeSnippetScalarFieldEnum | CodeSnippetScalarFieldEnum[]
  }

  /**
   * CodeSnippet findFirstOrThrow
   */
  export type CodeSnippetFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetInclude<ExtArgs> | null
    /**
     * Filter, which CodeSnippet to fetch.
     */
    where?: CodeSnippetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CodeSnippets to fetch.
     */
    orderBy?: CodeSnippetOrderByWithRelationInput | CodeSnippetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CodeSnippets.
     */
    cursor?: CodeSnippetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CodeSnippets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CodeSnippets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CodeSnippets.
     */
    distinct?: CodeSnippetScalarFieldEnum | CodeSnippetScalarFieldEnum[]
  }

  /**
   * CodeSnippet findMany
   */
  export type CodeSnippetFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetInclude<ExtArgs> | null
    /**
     * Filter, which CodeSnippets to fetch.
     */
    where?: CodeSnippetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CodeSnippets to fetch.
     */
    orderBy?: CodeSnippetOrderByWithRelationInput | CodeSnippetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CodeSnippets.
     */
    cursor?: CodeSnippetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CodeSnippets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CodeSnippets.
     */
    skip?: number
    distinct?: CodeSnippetScalarFieldEnum | CodeSnippetScalarFieldEnum[]
  }

  /**
   * CodeSnippet create
   */
  export type CodeSnippetCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetInclude<ExtArgs> | null
    /**
     * The data needed to create a CodeSnippet.
     */
    data: XOR<CodeSnippetCreateInput, CodeSnippetUncheckedCreateInput>
  }

  /**
   * CodeSnippet createMany
   */
  export type CodeSnippetCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CodeSnippets.
     */
    data: CodeSnippetCreateManyInput | CodeSnippetCreateManyInput[]
  }

  /**
   * CodeSnippet createManyAndReturn
   */
  export type CodeSnippetCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * The data used to create many CodeSnippets.
     */
    data: CodeSnippetCreateManyInput | CodeSnippetCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CodeSnippet update
   */
  export type CodeSnippetUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetInclude<ExtArgs> | null
    /**
     * The data needed to update a CodeSnippet.
     */
    data: XOR<CodeSnippetUpdateInput, CodeSnippetUncheckedUpdateInput>
    /**
     * Choose, which CodeSnippet to update.
     */
    where: CodeSnippetWhereUniqueInput
  }

  /**
   * CodeSnippet updateMany
   */
  export type CodeSnippetUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CodeSnippets.
     */
    data: XOR<CodeSnippetUpdateManyMutationInput, CodeSnippetUncheckedUpdateManyInput>
    /**
     * Filter which CodeSnippets to update
     */
    where?: CodeSnippetWhereInput
    /**
     * Limit how many CodeSnippets to update.
     */
    limit?: number
  }

  /**
   * CodeSnippet updateManyAndReturn
   */
  export type CodeSnippetUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * The data used to update CodeSnippets.
     */
    data: XOR<CodeSnippetUpdateManyMutationInput, CodeSnippetUncheckedUpdateManyInput>
    /**
     * Filter which CodeSnippets to update
     */
    where?: CodeSnippetWhereInput
    /**
     * Limit how many CodeSnippets to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CodeSnippet upsert
   */
  export type CodeSnippetUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetInclude<ExtArgs> | null
    /**
     * The filter to search for the CodeSnippet to update in case it exists.
     */
    where: CodeSnippetWhereUniqueInput
    /**
     * In case the CodeSnippet found by the `where` argument doesn't exist, create a new CodeSnippet with this data.
     */
    create: XOR<CodeSnippetCreateInput, CodeSnippetUncheckedCreateInput>
    /**
     * In case the CodeSnippet was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CodeSnippetUpdateInput, CodeSnippetUncheckedUpdateInput>
  }

  /**
   * CodeSnippet delete
   */
  export type CodeSnippetDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetInclude<ExtArgs> | null
    /**
     * Filter which CodeSnippet to delete.
     */
    where: CodeSnippetWhereUniqueInput
  }

  /**
   * CodeSnippet deleteMany
   */
  export type CodeSnippetDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CodeSnippets to delete
     */
    where?: CodeSnippetWhereInput
    /**
     * Limit how many CodeSnippets to delete.
     */
    limit?: number
  }

  /**
   * CodeSnippet without action
   */
  export type CodeSnippetDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CodeSnippet
     */
    select?: CodeSnippetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CodeSnippet
     */
    omit?: CodeSnippetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CodeSnippetInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const CategoryScalarFieldEnum: {
    id: 'id',
    name: 'name',
    parentId: 'parentId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum]


  export const ConceptScalarFieldEnum: {
    id: 'id',
    title: 'title',
    category: 'category',
    summary: 'summary',
    details: 'details',
    keyPoints: 'keyPoints',
    examples: 'examples',
    relatedConcepts: 'relatedConcepts',
    relationships: 'relationships',
    confidenceScore: 'confidenceScore',
    lastUpdated: 'lastUpdated',
    conversationId: 'conversationId'
  };

  export type ConceptScalarFieldEnum = (typeof ConceptScalarFieldEnum)[keyof typeof ConceptScalarFieldEnum]


  export const ConversationScalarFieldEnum: {
    id: 'id',
    text: 'text',
    summary: 'summary',
    createdAt: 'createdAt'
  };

  export type ConversationScalarFieldEnum = (typeof ConversationScalarFieldEnum)[keyof typeof ConversationScalarFieldEnum]


  export const OccurrenceScalarFieldEnum: {
    id: 'id',
    conversationId: 'conversationId',
    conceptId: 'conceptId',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type OccurrenceScalarFieldEnum = (typeof OccurrenceScalarFieldEnum)[keyof typeof OccurrenceScalarFieldEnum]


  export const CodeSnippetScalarFieldEnum: {
    id: 'id',
    language: 'language',
    description: 'description',
    code: 'code',
    conceptId: 'conceptId'
  };

  export type CodeSnippetScalarFieldEnum = (typeof CodeSnippetScalarFieldEnum)[keyof typeof CodeSnippetScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    
  /**
   * Deep Input Types
   */


  export type CategoryWhereInput = {
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    id?: StringFilter<"Category"> | string
    name?: StringFilter<"Category"> | string
    parentId?: StringNullableFilter<"Category"> | string | null
    createdAt?: DateTimeFilter<"Category"> | Date | string
    updatedAt?: DateTimeFilter<"Category"> | Date | string
    parent?: XOR<CategoryNullableScalarRelationFilter, CategoryWhereInput> | null
    children?: CategoryListRelationFilter
    concepts?: ConceptListRelationFilter
  }

  export type CategoryOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    parentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    parent?: CategoryOrderByWithRelationInput
    children?: CategoryOrderByRelationAggregateInput
    concepts?: ConceptOrderByRelationAggregateInput
  }

  export type CategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    name?: StringFilter<"Category"> | string
    parentId?: StringNullableFilter<"Category"> | string | null
    createdAt?: DateTimeFilter<"Category"> | Date | string
    updatedAt?: DateTimeFilter<"Category"> | Date | string
    parent?: XOR<CategoryNullableScalarRelationFilter, CategoryWhereInput> | null
    children?: CategoryListRelationFilter
    concepts?: ConceptListRelationFilter
  }, "id">

  export type CategoryOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    parentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CategoryCountOrderByAggregateInput
    _max?: CategoryMaxOrderByAggregateInput
    _min?: CategoryMinOrderByAggregateInput
  }

  export type CategoryScalarWhereWithAggregatesInput = {
    AND?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    OR?: CategoryScalarWhereWithAggregatesInput[]
    NOT?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Category"> | string
    name?: StringWithAggregatesFilter<"Category"> | string
    parentId?: StringNullableWithAggregatesFilter<"Category"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Category"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Category"> | Date | string
  }

  export type ConceptWhereInput = {
    AND?: ConceptWhereInput | ConceptWhereInput[]
    OR?: ConceptWhereInput[]
    NOT?: ConceptWhereInput | ConceptWhereInput[]
    id?: StringFilter<"Concept"> | string
    title?: StringFilter<"Concept"> | string
    category?: StringFilter<"Concept"> | string
    summary?: StringFilter<"Concept"> | string
    details?: StringFilter<"Concept"> | string
    keyPoints?: StringFilter<"Concept"> | string
    examples?: StringFilter<"Concept"> | string
    relatedConcepts?: StringFilter<"Concept"> | string
    relationships?: StringFilter<"Concept"> | string
    confidenceScore?: FloatFilter<"Concept"> | number
    lastUpdated?: DateTimeFilter<"Concept"> | Date | string
    conversationId?: StringFilter<"Concept"> | string
    codeSnippets?: CodeSnippetListRelationFilter
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    categories?: CategoryListRelationFilter
    occurrences?: OccurrenceListRelationFilter
  }

  export type ConceptOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    category?: SortOrder
    summary?: SortOrder
    details?: SortOrder
    keyPoints?: SortOrder
    examples?: SortOrder
    relatedConcepts?: SortOrder
    relationships?: SortOrder
    confidenceScore?: SortOrder
    lastUpdated?: SortOrder
    conversationId?: SortOrder
    codeSnippets?: CodeSnippetOrderByRelationAggregateInput
    conversation?: ConversationOrderByWithRelationInput
    categories?: CategoryOrderByRelationAggregateInput
    occurrences?: OccurrenceOrderByRelationAggregateInput
  }

  export type ConceptWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ConceptWhereInput | ConceptWhereInput[]
    OR?: ConceptWhereInput[]
    NOT?: ConceptWhereInput | ConceptWhereInput[]
    title?: StringFilter<"Concept"> | string
    category?: StringFilter<"Concept"> | string
    summary?: StringFilter<"Concept"> | string
    details?: StringFilter<"Concept"> | string
    keyPoints?: StringFilter<"Concept"> | string
    examples?: StringFilter<"Concept"> | string
    relatedConcepts?: StringFilter<"Concept"> | string
    relationships?: StringFilter<"Concept"> | string
    confidenceScore?: FloatFilter<"Concept"> | number
    lastUpdated?: DateTimeFilter<"Concept"> | Date | string
    conversationId?: StringFilter<"Concept"> | string
    codeSnippets?: CodeSnippetListRelationFilter
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    categories?: CategoryListRelationFilter
    occurrences?: OccurrenceListRelationFilter
  }, "id">

  export type ConceptOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    category?: SortOrder
    summary?: SortOrder
    details?: SortOrder
    keyPoints?: SortOrder
    examples?: SortOrder
    relatedConcepts?: SortOrder
    relationships?: SortOrder
    confidenceScore?: SortOrder
    lastUpdated?: SortOrder
    conversationId?: SortOrder
    _count?: ConceptCountOrderByAggregateInput
    _avg?: ConceptAvgOrderByAggregateInput
    _max?: ConceptMaxOrderByAggregateInput
    _min?: ConceptMinOrderByAggregateInput
    _sum?: ConceptSumOrderByAggregateInput
  }

  export type ConceptScalarWhereWithAggregatesInput = {
    AND?: ConceptScalarWhereWithAggregatesInput | ConceptScalarWhereWithAggregatesInput[]
    OR?: ConceptScalarWhereWithAggregatesInput[]
    NOT?: ConceptScalarWhereWithAggregatesInput | ConceptScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Concept"> | string
    title?: StringWithAggregatesFilter<"Concept"> | string
    category?: StringWithAggregatesFilter<"Concept"> | string
    summary?: StringWithAggregatesFilter<"Concept"> | string
    details?: StringWithAggregatesFilter<"Concept"> | string
    keyPoints?: StringWithAggregatesFilter<"Concept"> | string
    examples?: StringWithAggregatesFilter<"Concept"> | string
    relatedConcepts?: StringWithAggregatesFilter<"Concept"> | string
    relationships?: StringWithAggregatesFilter<"Concept"> | string
    confidenceScore?: FloatWithAggregatesFilter<"Concept"> | number
    lastUpdated?: DateTimeWithAggregatesFilter<"Concept"> | Date | string
    conversationId?: StringWithAggregatesFilter<"Concept"> | string
  }

  export type ConversationWhereInput = {
    AND?: ConversationWhereInput | ConversationWhereInput[]
    OR?: ConversationWhereInput[]
    NOT?: ConversationWhereInput | ConversationWhereInput[]
    id?: StringFilter<"Conversation"> | string
    text?: StringFilter<"Conversation"> | string
    summary?: StringFilter<"Conversation"> | string
    createdAt?: DateTimeFilter<"Conversation"> | Date | string
    concepts?: ConceptListRelationFilter
    occurrences?: OccurrenceListRelationFilter
  }

  export type ConversationOrderByWithRelationInput = {
    id?: SortOrder
    text?: SortOrder
    summary?: SortOrder
    createdAt?: SortOrder
    concepts?: ConceptOrderByRelationAggregateInput
    occurrences?: OccurrenceOrderByRelationAggregateInput
  }

  export type ConversationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ConversationWhereInput | ConversationWhereInput[]
    OR?: ConversationWhereInput[]
    NOT?: ConversationWhereInput | ConversationWhereInput[]
    text?: StringFilter<"Conversation"> | string
    summary?: StringFilter<"Conversation"> | string
    createdAt?: DateTimeFilter<"Conversation"> | Date | string
    concepts?: ConceptListRelationFilter
    occurrences?: OccurrenceListRelationFilter
  }, "id">

  export type ConversationOrderByWithAggregationInput = {
    id?: SortOrder
    text?: SortOrder
    summary?: SortOrder
    createdAt?: SortOrder
    _count?: ConversationCountOrderByAggregateInput
    _max?: ConversationMaxOrderByAggregateInput
    _min?: ConversationMinOrderByAggregateInput
  }

  export type ConversationScalarWhereWithAggregatesInput = {
    AND?: ConversationScalarWhereWithAggregatesInput | ConversationScalarWhereWithAggregatesInput[]
    OR?: ConversationScalarWhereWithAggregatesInput[]
    NOT?: ConversationScalarWhereWithAggregatesInput | ConversationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Conversation"> | string
    text?: StringWithAggregatesFilter<"Conversation"> | string
    summary?: StringWithAggregatesFilter<"Conversation"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Conversation"> | Date | string
  }

  export type OccurrenceWhereInput = {
    AND?: OccurrenceWhereInput | OccurrenceWhereInput[]
    OR?: OccurrenceWhereInput[]
    NOT?: OccurrenceWhereInput | OccurrenceWhereInput[]
    id?: StringFilter<"Occurrence"> | string
    conversationId?: StringFilter<"Occurrence"> | string
    conceptId?: StringFilter<"Occurrence"> | string
    notes?: StringNullableFilter<"Occurrence"> | string | null
    createdAt?: DateTimeFilter<"Occurrence"> | Date | string
    updatedAt?: DateTimeFilter<"Occurrence"> | Date | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }

  export type OccurrenceOrderByWithRelationInput = {
    id?: SortOrder
    conversationId?: SortOrder
    conceptId?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    conversation?: ConversationOrderByWithRelationInput
    concept?: ConceptOrderByWithRelationInput
  }

  export type OccurrenceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: OccurrenceWhereInput | OccurrenceWhereInput[]
    OR?: OccurrenceWhereInput[]
    NOT?: OccurrenceWhereInput | OccurrenceWhereInput[]
    conversationId?: StringFilter<"Occurrence"> | string
    conceptId?: StringFilter<"Occurrence"> | string
    notes?: StringNullableFilter<"Occurrence"> | string | null
    createdAt?: DateTimeFilter<"Occurrence"> | Date | string
    updatedAt?: DateTimeFilter<"Occurrence"> | Date | string
    conversation?: XOR<ConversationScalarRelationFilter, ConversationWhereInput>
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }, "id">

  export type OccurrenceOrderByWithAggregationInput = {
    id?: SortOrder
    conversationId?: SortOrder
    conceptId?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: OccurrenceCountOrderByAggregateInput
    _max?: OccurrenceMaxOrderByAggregateInput
    _min?: OccurrenceMinOrderByAggregateInput
  }

  export type OccurrenceScalarWhereWithAggregatesInput = {
    AND?: OccurrenceScalarWhereWithAggregatesInput | OccurrenceScalarWhereWithAggregatesInput[]
    OR?: OccurrenceScalarWhereWithAggregatesInput[]
    NOT?: OccurrenceScalarWhereWithAggregatesInput | OccurrenceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Occurrence"> | string
    conversationId?: StringWithAggregatesFilter<"Occurrence"> | string
    conceptId?: StringWithAggregatesFilter<"Occurrence"> | string
    notes?: StringNullableWithAggregatesFilter<"Occurrence"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Occurrence"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Occurrence"> | Date | string
  }

  export type CodeSnippetWhereInput = {
    AND?: CodeSnippetWhereInput | CodeSnippetWhereInput[]
    OR?: CodeSnippetWhereInput[]
    NOT?: CodeSnippetWhereInput | CodeSnippetWhereInput[]
    id?: StringFilter<"CodeSnippet"> | string
    language?: StringFilter<"CodeSnippet"> | string
    description?: StringFilter<"CodeSnippet"> | string
    code?: StringFilter<"CodeSnippet"> | string
    conceptId?: StringFilter<"CodeSnippet"> | string
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }

  export type CodeSnippetOrderByWithRelationInput = {
    id?: SortOrder
    language?: SortOrder
    description?: SortOrder
    code?: SortOrder
    conceptId?: SortOrder
    concept?: ConceptOrderByWithRelationInput
  }

  export type CodeSnippetWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CodeSnippetWhereInput | CodeSnippetWhereInput[]
    OR?: CodeSnippetWhereInput[]
    NOT?: CodeSnippetWhereInput | CodeSnippetWhereInput[]
    language?: StringFilter<"CodeSnippet"> | string
    description?: StringFilter<"CodeSnippet"> | string
    code?: StringFilter<"CodeSnippet"> | string
    conceptId?: StringFilter<"CodeSnippet"> | string
    concept?: XOR<ConceptScalarRelationFilter, ConceptWhereInput>
  }, "id">

  export type CodeSnippetOrderByWithAggregationInput = {
    id?: SortOrder
    language?: SortOrder
    description?: SortOrder
    code?: SortOrder
    conceptId?: SortOrder
    _count?: CodeSnippetCountOrderByAggregateInput
    _max?: CodeSnippetMaxOrderByAggregateInput
    _min?: CodeSnippetMinOrderByAggregateInput
  }

  export type CodeSnippetScalarWhereWithAggregatesInput = {
    AND?: CodeSnippetScalarWhereWithAggregatesInput | CodeSnippetScalarWhereWithAggregatesInput[]
    OR?: CodeSnippetScalarWhereWithAggregatesInput[]
    NOT?: CodeSnippetScalarWhereWithAggregatesInput | CodeSnippetScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CodeSnippet"> | string
    language?: StringWithAggregatesFilter<"CodeSnippet"> | string
    description?: StringWithAggregatesFilter<"CodeSnippet"> | string
    code?: StringWithAggregatesFilter<"CodeSnippet"> | string
    conceptId?: StringWithAggregatesFilter<"CodeSnippet"> | string
  }

  export type CategoryCreateInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    parent?: CategoryCreateNestedOneWithoutChildrenInput
    children?: CategoryCreateNestedManyWithoutParentInput
    concepts?: ConceptCreateNestedManyWithoutCategoriesInput
  }

  export type CategoryUncheckedCreateInput = {
    id?: string
    name: string
    parentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: CategoryUncheckedCreateNestedManyWithoutParentInput
    concepts?: ConceptUncheckedCreateNestedManyWithoutCategoriesInput
  }

  export type CategoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parent?: CategoryUpdateOneWithoutChildrenNestedInput
    children?: CategoryUpdateManyWithoutParentNestedInput
    concepts?: ConceptUpdateManyWithoutCategoriesNestedInput
  }

  export type CategoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: CategoryUncheckedUpdateManyWithoutParentNestedInput
    concepts?: ConceptUncheckedUpdateManyWithoutCategoriesNestedInput
  }

  export type CategoryCreateManyInput = {
    id?: string
    name: string
    parentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CategoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConceptCreateInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
    codeSnippets?: CodeSnippetCreateNestedManyWithoutConceptInput
    conversation: ConversationCreateNestedOneWithoutConceptsInput
    categories?: CategoryCreateNestedManyWithoutConceptsInput
    occurrences?: OccurrenceCreateNestedManyWithoutConceptInput
  }

  export type ConceptUncheckedCreateInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
    conversationId: string
    codeSnippets?: CodeSnippetUncheckedCreateNestedManyWithoutConceptInput
    categories?: CategoryUncheckedCreateNestedManyWithoutConceptsInput
    occurrences?: OccurrenceUncheckedCreateNestedManyWithoutConceptInput
  }

  export type ConceptUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    codeSnippets?: CodeSnippetUpdateManyWithoutConceptNestedInput
    conversation?: ConversationUpdateOneRequiredWithoutConceptsNestedInput
    categories?: CategoryUpdateManyWithoutConceptsNestedInput
    occurrences?: OccurrenceUpdateManyWithoutConceptNestedInput
  }

  export type ConceptUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    codeSnippets?: CodeSnippetUncheckedUpdateManyWithoutConceptNestedInput
    categories?: CategoryUncheckedUpdateManyWithoutConceptsNestedInput
    occurrences?: OccurrenceUncheckedUpdateManyWithoutConceptNestedInput
  }

  export type ConceptCreateManyInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
    conversationId: string
  }

  export type ConceptUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConceptUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
  }

  export type ConversationCreateInput = {
    id?: string
    text: string
    summary: string
    createdAt?: Date | string
    concepts?: ConceptCreateNestedManyWithoutConversationInput
    occurrences?: OccurrenceCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateInput = {
    id?: string
    text: string
    summary: string
    createdAt?: Date | string
    concepts?: ConceptUncheckedCreateNestedManyWithoutConversationInput
    occurrences?: OccurrenceUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    concepts?: ConceptUpdateManyWithoutConversationNestedInput
    occurrences?: OccurrenceUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    concepts?: ConceptUncheckedUpdateManyWithoutConversationNestedInput
    occurrences?: OccurrenceUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConversationCreateManyInput = {
    id?: string
    text: string
    summary: string
    createdAt?: Date | string
  }

  export type ConversationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConversationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OccurrenceCreateInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutOccurrencesInput
    concept: ConceptCreateNestedOneWithoutOccurrencesInput
  }

  export type OccurrenceUncheckedCreateInput = {
    id?: string
    conversationId: string
    conceptId: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OccurrenceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutOccurrencesNestedInput
    concept?: ConceptUpdateOneRequiredWithoutOccurrencesNestedInput
  }

  export type OccurrenceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    conceptId?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OccurrenceCreateManyInput = {
    id?: string
    conversationId: string
    conceptId: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OccurrenceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OccurrenceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    conceptId?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CodeSnippetCreateInput = {
    id?: string
    language: string
    description: string
    code: string
    concept: ConceptCreateNestedOneWithoutCodeSnippetsInput
  }

  export type CodeSnippetUncheckedCreateInput = {
    id?: string
    language: string
    description: string
    code: string
    conceptId: string
  }

  export type CodeSnippetUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    concept?: ConceptUpdateOneRequiredWithoutCodeSnippetsNestedInput
  }

  export type CodeSnippetUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    conceptId?: StringFieldUpdateOperationsInput | string
  }

  export type CodeSnippetCreateManyInput = {
    id?: string
    language: string
    description: string
    code: string
    conceptId: string
  }

  export type CodeSnippetUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
  }

  export type CodeSnippetUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    conceptId?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type CategoryNullableScalarRelationFilter = {
    is?: CategoryWhereInput | null
    isNot?: CategoryWhereInput | null
  }

  export type CategoryListRelationFilter = {
    every?: CategoryWhereInput
    some?: CategoryWhereInput
    none?: CategoryWhereInput
  }

  export type ConceptListRelationFilter = {
    every?: ConceptWhereInput
    some?: ConceptWhereInput
    none?: ConceptWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CategoryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ConceptOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CategoryCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type CodeSnippetListRelationFilter = {
    every?: CodeSnippetWhereInput
    some?: CodeSnippetWhereInput
    none?: CodeSnippetWhereInput
  }

  export type ConversationScalarRelationFilter = {
    is?: ConversationWhereInput
    isNot?: ConversationWhereInput
  }

  export type OccurrenceListRelationFilter = {
    every?: OccurrenceWhereInput
    some?: OccurrenceWhereInput
    none?: OccurrenceWhereInput
  }

  export type CodeSnippetOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type OccurrenceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ConceptCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    category?: SortOrder
    summary?: SortOrder
    details?: SortOrder
    keyPoints?: SortOrder
    examples?: SortOrder
    relatedConcepts?: SortOrder
    relationships?: SortOrder
    confidenceScore?: SortOrder
    lastUpdated?: SortOrder
    conversationId?: SortOrder
  }

  export type ConceptAvgOrderByAggregateInput = {
    confidenceScore?: SortOrder
  }

  export type ConceptMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    category?: SortOrder
    summary?: SortOrder
    details?: SortOrder
    keyPoints?: SortOrder
    examples?: SortOrder
    relatedConcepts?: SortOrder
    relationships?: SortOrder
    confidenceScore?: SortOrder
    lastUpdated?: SortOrder
    conversationId?: SortOrder
  }

  export type ConceptMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    category?: SortOrder
    summary?: SortOrder
    details?: SortOrder
    keyPoints?: SortOrder
    examples?: SortOrder
    relatedConcepts?: SortOrder
    relationships?: SortOrder
    confidenceScore?: SortOrder
    lastUpdated?: SortOrder
    conversationId?: SortOrder
  }

  export type ConceptSumOrderByAggregateInput = {
    confidenceScore?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type ConversationCountOrderByAggregateInput = {
    id?: SortOrder
    text?: SortOrder
    summary?: SortOrder
    createdAt?: SortOrder
  }

  export type ConversationMaxOrderByAggregateInput = {
    id?: SortOrder
    text?: SortOrder
    summary?: SortOrder
    createdAt?: SortOrder
  }

  export type ConversationMinOrderByAggregateInput = {
    id?: SortOrder
    text?: SortOrder
    summary?: SortOrder
    createdAt?: SortOrder
  }

  export type ConceptScalarRelationFilter = {
    is?: ConceptWhereInput
    isNot?: ConceptWhereInput
  }

  export type OccurrenceCountOrderByAggregateInput = {
    id?: SortOrder
    conversationId?: SortOrder
    conceptId?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OccurrenceMaxOrderByAggregateInput = {
    id?: SortOrder
    conversationId?: SortOrder
    conceptId?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OccurrenceMinOrderByAggregateInput = {
    id?: SortOrder
    conversationId?: SortOrder
    conceptId?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CodeSnippetCountOrderByAggregateInput = {
    id?: SortOrder
    language?: SortOrder
    description?: SortOrder
    code?: SortOrder
    conceptId?: SortOrder
  }

  export type CodeSnippetMaxOrderByAggregateInput = {
    id?: SortOrder
    language?: SortOrder
    description?: SortOrder
    code?: SortOrder
    conceptId?: SortOrder
  }

  export type CodeSnippetMinOrderByAggregateInput = {
    id?: SortOrder
    language?: SortOrder
    description?: SortOrder
    code?: SortOrder
    conceptId?: SortOrder
  }

  export type CategoryCreateNestedOneWithoutChildrenInput = {
    create?: XOR<CategoryCreateWithoutChildrenInput, CategoryUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutChildrenInput
    connect?: CategoryWhereUniqueInput
  }

  export type CategoryCreateNestedManyWithoutParentInput = {
    create?: XOR<CategoryCreateWithoutParentInput, CategoryUncheckedCreateWithoutParentInput> | CategoryCreateWithoutParentInput[] | CategoryUncheckedCreateWithoutParentInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutParentInput | CategoryCreateOrConnectWithoutParentInput[]
    createMany?: CategoryCreateManyParentInputEnvelope
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
  }

  export type ConceptCreateNestedManyWithoutCategoriesInput = {
    create?: XOR<ConceptCreateWithoutCategoriesInput, ConceptUncheckedCreateWithoutCategoriesInput> | ConceptCreateWithoutCategoriesInput[] | ConceptUncheckedCreateWithoutCategoriesInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutCategoriesInput | ConceptCreateOrConnectWithoutCategoriesInput[]
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
  }

  export type CategoryUncheckedCreateNestedManyWithoutParentInput = {
    create?: XOR<CategoryCreateWithoutParentInput, CategoryUncheckedCreateWithoutParentInput> | CategoryCreateWithoutParentInput[] | CategoryUncheckedCreateWithoutParentInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutParentInput | CategoryCreateOrConnectWithoutParentInput[]
    createMany?: CategoryCreateManyParentInputEnvelope
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
  }

  export type ConceptUncheckedCreateNestedManyWithoutCategoriesInput = {
    create?: XOR<ConceptCreateWithoutCategoriesInput, ConceptUncheckedCreateWithoutCategoriesInput> | ConceptCreateWithoutCategoriesInput[] | ConceptUncheckedCreateWithoutCategoriesInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutCategoriesInput | ConceptCreateOrConnectWithoutCategoriesInput[]
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CategoryUpdateOneWithoutChildrenNestedInput = {
    create?: XOR<CategoryCreateWithoutChildrenInput, CategoryUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutChildrenInput
    upsert?: CategoryUpsertWithoutChildrenInput
    disconnect?: CategoryWhereInput | boolean
    delete?: CategoryWhereInput | boolean
    connect?: CategoryWhereUniqueInput
    update?: XOR<XOR<CategoryUpdateToOneWithWhereWithoutChildrenInput, CategoryUpdateWithoutChildrenInput>, CategoryUncheckedUpdateWithoutChildrenInput>
  }

  export type CategoryUpdateManyWithoutParentNestedInput = {
    create?: XOR<CategoryCreateWithoutParentInput, CategoryUncheckedCreateWithoutParentInput> | CategoryCreateWithoutParentInput[] | CategoryUncheckedCreateWithoutParentInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutParentInput | CategoryCreateOrConnectWithoutParentInput[]
    upsert?: CategoryUpsertWithWhereUniqueWithoutParentInput | CategoryUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: CategoryCreateManyParentInputEnvelope
    set?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    disconnect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    delete?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    update?: CategoryUpdateWithWhereUniqueWithoutParentInput | CategoryUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: CategoryUpdateManyWithWhereWithoutParentInput | CategoryUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: CategoryScalarWhereInput | CategoryScalarWhereInput[]
  }

  export type ConceptUpdateManyWithoutCategoriesNestedInput = {
    create?: XOR<ConceptCreateWithoutCategoriesInput, ConceptUncheckedCreateWithoutCategoriesInput> | ConceptCreateWithoutCategoriesInput[] | ConceptUncheckedCreateWithoutCategoriesInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutCategoriesInput | ConceptCreateOrConnectWithoutCategoriesInput[]
    upsert?: ConceptUpsertWithWhereUniqueWithoutCategoriesInput | ConceptUpsertWithWhereUniqueWithoutCategoriesInput[]
    set?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    disconnect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    delete?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    update?: ConceptUpdateWithWhereUniqueWithoutCategoriesInput | ConceptUpdateWithWhereUniqueWithoutCategoriesInput[]
    updateMany?: ConceptUpdateManyWithWhereWithoutCategoriesInput | ConceptUpdateManyWithWhereWithoutCategoriesInput[]
    deleteMany?: ConceptScalarWhereInput | ConceptScalarWhereInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type CategoryUncheckedUpdateManyWithoutParentNestedInput = {
    create?: XOR<CategoryCreateWithoutParentInput, CategoryUncheckedCreateWithoutParentInput> | CategoryCreateWithoutParentInput[] | CategoryUncheckedCreateWithoutParentInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutParentInput | CategoryCreateOrConnectWithoutParentInput[]
    upsert?: CategoryUpsertWithWhereUniqueWithoutParentInput | CategoryUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: CategoryCreateManyParentInputEnvelope
    set?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    disconnect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    delete?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    update?: CategoryUpdateWithWhereUniqueWithoutParentInput | CategoryUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: CategoryUpdateManyWithWhereWithoutParentInput | CategoryUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: CategoryScalarWhereInput | CategoryScalarWhereInput[]
  }

  export type ConceptUncheckedUpdateManyWithoutCategoriesNestedInput = {
    create?: XOR<ConceptCreateWithoutCategoriesInput, ConceptUncheckedCreateWithoutCategoriesInput> | ConceptCreateWithoutCategoriesInput[] | ConceptUncheckedCreateWithoutCategoriesInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutCategoriesInput | ConceptCreateOrConnectWithoutCategoriesInput[]
    upsert?: ConceptUpsertWithWhereUniqueWithoutCategoriesInput | ConceptUpsertWithWhereUniqueWithoutCategoriesInput[]
    set?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    disconnect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    delete?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    update?: ConceptUpdateWithWhereUniqueWithoutCategoriesInput | ConceptUpdateWithWhereUniqueWithoutCategoriesInput[]
    updateMany?: ConceptUpdateManyWithWhereWithoutCategoriesInput | ConceptUpdateManyWithWhereWithoutCategoriesInput[]
    deleteMany?: ConceptScalarWhereInput | ConceptScalarWhereInput[]
  }

  export type CodeSnippetCreateNestedManyWithoutConceptInput = {
    create?: XOR<CodeSnippetCreateWithoutConceptInput, CodeSnippetUncheckedCreateWithoutConceptInput> | CodeSnippetCreateWithoutConceptInput[] | CodeSnippetUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: CodeSnippetCreateOrConnectWithoutConceptInput | CodeSnippetCreateOrConnectWithoutConceptInput[]
    createMany?: CodeSnippetCreateManyConceptInputEnvelope
    connect?: CodeSnippetWhereUniqueInput | CodeSnippetWhereUniqueInput[]
  }

  export type ConversationCreateNestedOneWithoutConceptsInput = {
    create?: XOR<ConversationCreateWithoutConceptsInput, ConversationUncheckedCreateWithoutConceptsInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutConceptsInput
    connect?: ConversationWhereUniqueInput
  }

  export type CategoryCreateNestedManyWithoutConceptsInput = {
    create?: XOR<CategoryCreateWithoutConceptsInput, CategoryUncheckedCreateWithoutConceptsInput> | CategoryCreateWithoutConceptsInput[] | CategoryUncheckedCreateWithoutConceptsInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutConceptsInput | CategoryCreateOrConnectWithoutConceptsInput[]
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
  }

  export type OccurrenceCreateNestedManyWithoutConceptInput = {
    create?: XOR<OccurrenceCreateWithoutConceptInput, OccurrenceUncheckedCreateWithoutConceptInput> | OccurrenceCreateWithoutConceptInput[] | OccurrenceUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: OccurrenceCreateOrConnectWithoutConceptInput | OccurrenceCreateOrConnectWithoutConceptInput[]
    createMany?: OccurrenceCreateManyConceptInputEnvelope
    connect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
  }

  export type CodeSnippetUncheckedCreateNestedManyWithoutConceptInput = {
    create?: XOR<CodeSnippetCreateWithoutConceptInput, CodeSnippetUncheckedCreateWithoutConceptInput> | CodeSnippetCreateWithoutConceptInput[] | CodeSnippetUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: CodeSnippetCreateOrConnectWithoutConceptInput | CodeSnippetCreateOrConnectWithoutConceptInput[]
    createMany?: CodeSnippetCreateManyConceptInputEnvelope
    connect?: CodeSnippetWhereUniqueInput | CodeSnippetWhereUniqueInput[]
  }

  export type CategoryUncheckedCreateNestedManyWithoutConceptsInput = {
    create?: XOR<CategoryCreateWithoutConceptsInput, CategoryUncheckedCreateWithoutConceptsInput> | CategoryCreateWithoutConceptsInput[] | CategoryUncheckedCreateWithoutConceptsInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutConceptsInput | CategoryCreateOrConnectWithoutConceptsInput[]
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
  }

  export type OccurrenceUncheckedCreateNestedManyWithoutConceptInput = {
    create?: XOR<OccurrenceCreateWithoutConceptInput, OccurrenceUncheckedCreateWithoutConceptInput> | OccurrenceCreateWithoutConceptInput[] | OccurrenceUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: OccurrenceCreateOrConnectWithoutConceptInput | OccurrenceCreateOrConnectWithoutConceptInput[]
    createMany?: OccurrenceCreateManyConceptInputEnvelope
    connect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type CodeSnippetUpdateManyWithoutConceptNestedInput = {
    create?: XOR<CodeSnippetCreateWithoutConceptInput, CodeSnippetUncheckedCreateWithoutConceptInput> | CodeSnippetCreateWithoutConceptInput[] | CodeSnippetUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: CodeSnippetCreateOrConnectWithoutConceptInput | CodeSnippetCreateOrConnectWithoutConceptInput[]
    upsert?: CodeSnippetUpsertWithWhereUniqueWithoutConceptInput | CodeSnippetUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: CodeSnippetCreateManyConceptInputEnvelope
    set?: CodeSnippetWhereUniqueInput | CodeSnippetWhereUniqueInput[]
    disconnect?: CodeSnippetWhereUniqueInput | CodeSnippetWhereUniqueInput[]
    delete?: CodeSnippetWhereUniqueInput | CodeSnippetWhereUniqueInput[]
    connect?: CodeSnippetWhereUniqueInput | CodeSnippetWhereUniqueInput[]
    update?: CodeSnippetUpdateWithWhereUniqueWithoutConceptInput | CodeSnippetUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: CodeSnippetUpdateManyWithWhereWithoutConceptInput | CodeSnippetUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: CodeSnippetScalarWhereInput | CodeSnippetScalarWhereInput[]
  }

  export type ConversationUpdateOneRequiredWithoutConceptsNestedInput = {
    create?: XOR<ConversationCreateWithoutConceptsInput, ConversationUncheckedCreateWithoutConceptsInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutConceptsInput
    upsert?: ConversationUpsertWithoutConceptsInput
    connect?: ConversationWhereUniqueInput
    update?: XOR<XOR<ConversationUpdateToOneWithWhereWithoutConceptsInput, ConversationUpdateWithoutConceptsInput>, ConversationUncheckedUpdateWithoutConceptsInput>
  }

  export type CategoryUpdateManyWithoutConceptsNestedInput = {
    create?: XOR<CategoryCreateWithoutConceptsInput, CategoryUncheckedCreateWithoutConceptsInput> | CategoryCreateWithoutConceptsInput[] | CategoryUncheckedCreateWithoutConceptsInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutConceptsInput | CategoryCreateOrConnectWithoutConceptsInput[]
    upsert?: CategoryUpsertWithWhereUniqueWithoutConceptsInput | CategoryUpsertWithWhereUniqueWithoutConceptsInput[]
    set?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    disconnect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    delete?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    update?: CategoryUpdateWithWhereUniqueWithoutConceptsInput | CategoryUpdateWithWhereUniqueWithoutConceptsInput[]
    updateMany?: CategoryUpdateManyWithWhereWithoutConceptsInput | CategoryUpdateManyWithWhereWithoutConceptsInput[]
    deleteMany?: CategoryScalarWhereInput | CategoryScalarWhereInput[]
  }

  export type OccurrenceUpdateManyWithoutConceptNestedInput = {
    create?: XOR<OccurrenceCreateWithoutConceptInput, OccurrenceUncheckedCreateWithoutConceptInput> | OccurrenceCreateWithoutConceptInput[] | OccurrenceUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: OccurrenceCreateOrConnectWithoutConceptInput | OccurrenceCreateOrConnectWithoutConceptInput[]
    upsert?: OccurrenceUpsertWithWhereUniqueWithoutConceptInput | OccurrenceUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: OccurrenceCreateManyConceptInputEnvelope
    set?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    disconnect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    delete?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    connect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    update?: OccurrenceUpdateWithWhereUniqueWithoutConceptInput | OccurrenceUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: OccurrenceUpdateManyWithWhereWithoutConceptInput | OccurrenceUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: OccurrenceScalarWhereInput | OccurrenceScalarWhereInput[]
  }

  export type CodeSnippetUncheckedUpdateManyWithoutConceptNestedInput = {
    create?: XOR<CodeSnippetCreateWithoutConceptInput, CodeSnippetUncheckedCreateWithoutConceptInput> | CodeSnippetCreateWithoutConceptInput[] | CodeSnippetUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: CodeSnippetCreateOrConnectWithoutConceptInput | CodeSnippetCreateOrConnectWithoutConceptInput[]
    upsert?: CodeSnippetUpsertWithWhereUniqueWithoutConceptInput | CodeSnippetUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: CodeSnippetCreateManyConceptInputEnvelope
    set?: CodeSnippetWhereUniqueInput | CodeSnippetWhereUniqueInput[]
    disconnect?: CodeSnippetWhereUniqueInput | CodeSnippetWhereUniqueInput[]
    delete?: CodeSnippetWhereUniqueInput | CodeSnippetWhereUniqueInput[]
    connect?: CodeSnippetWhereUniqueInput | CodeSnippetWhereUniqueInput[]
    update?: CodeSnippetUpdateWithWhereUniqueWithoutConceptInput | CodeSnippetUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: CodeSnippetUpdateManyWithWhereWithoutConceptInput | CodeSnippetUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: CodeSnippetScalarWhereInput | CodeSnippetScalarWhereInput[]
  }

  export type CategoryUncheckedUpdateManyWithoutConceptsNestedInput = {
    create?: XOR<CategoryCreateWithoutConceptsInput, CategoryUncheckedCreateWithoutConceptsInput> | CategoryCreateWithoutConceptsInput[] | CategoryUncheckedCreateWithoutConceptsInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutConceptsInput | CategoryCreateOrConnectWithoutConceptsInput[]
    upsert?: CategoryUpsertWithWhereUniqueWithoutConceptsInput | CategoryUpsertWithWhereUniqueWithoutConceptsInput[]
    set?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    disconnect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    delete?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    update?: CategoryUpdateWithWhereUniqueWithoutConceptsInput | CategoryUpdateWithWhereUniqueWithoutConceptsInput[]
    updateMany?: CategoryUpdateManyWithWhereWithoutConceptsInput | CategoryUpdateManyWithWhereWithoutConceptsInput[]
    deleteMany?: CategoryScalarWhereInput | CategoryScalarWhereInput[]
  }

  export type OccurrenceUncheckedUpdateManyWithoutConceptNestedInput = {
    create?: XOR<OccurrenceCreateWithoutConceptInput, OccurrenceUncheckedCreateWithoutConceptInput> | OccurrenceCreateWithoutConceptInput[] | OccurrenceUncheckedCreateWithoutConceptInput[]
    connectOrCreate?: OccurrenceCreateOrConnectWithoutConceptInput | OccurrenceCreateOrConnectWithoutConceptInput[]
    upsert?: OccurrenceUpsertWithWhereUniqueWithoutConceptInput | OccurrenceUpsertWithWhereUniqueWithoutConceptInput[]
    createMany?: OccurrenceCreateManyConceptInputEnvelope
    set?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    disconnect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    delete?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    connect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    update?: OccurrenceUpdateWithWhereUniqueWithoutConceptInput | OccurrenceUpdateWithWhereUniqueWithoutConceptInput[]
    updateMany?: OccurrenceUpdateManyWithWhereWithoutConceptInput | OccurrenceUpdateManyWithWhereWithoutConceptInput[]
    deleteMany?: OccurrenceScalarWhereInput | OccurrenceScalarWhereInput[]
  }

  export type ConceptCreateNestedManyWithoutConversationInput = {
    create?: XOR<ConceptCreateWithoutConversationInput, ConceptUncheckedCreateWithoutConversationInput> | ConceptCreateWithoutConversationInput[] | ConceptUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutConversationInput | ConceptCreateOrConnectWithoutConversationInput[]
    createMany?: ConceptCreateManyConversationInputEnvelope
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
  }

  export type OccurrenceCreateNestedManyWithoutConversationInput = {
    create?: XOR<OccurrenceCreateWithoutConversationInput, OccurrenceUncheckedCreateWithoutConversationInput> | OccurrenceCreateWithoutConversationInput[] | OccurrenceUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: OccurrenceCreateOrConnectWithoutConversationInput | OccurrenceCreateOrConnectWithoutConversationInput[]
    createMany?: OccurrenceCreateManyConversationInputEnvelope
    connect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
  }

  export type ConceptUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<ConceptCreateWithoutConversationInput, ConceptUncheckedCreateWithoutConversationInput> | ConceptCreateWithoutConversationInput[] | ConceptUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutConversationInput | ConceptCreateOrConnectWithoutConversationInput[]
    createMany?: ConceptCreateManyConversationInputEnvelope
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
  }

  export type OccurrenceUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<OccurrenceCreateWithoutConversationInput, OccurrenceUncheckedCreateWithoutConversationInput> | OccurrenceCreateWithoutConversationInput[] | OccurrenceUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: OccurrenceCreateOrConnectWithoutConversationInput | OccurrenceCreateOrConnectWithoutConversationInput[]
    createMany?: OccurrenceCreateManyConversationInputEnvelope
    connect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
  }

  export type ConceptUpdateManyWithoutConversationNestedInput = {
    create?: XOR<ConceptCreateWithoutConversationInput, ConceptUncheckedCreateWithoutConversationInput> | ConceptCreateWithoutConversationInput[] | ConceptUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutConversationInput | ConceptCreateOrConnectWithoutConversationInput[]
    upsert?: ConceptUpsertWithWhereUniqueWithoutConversationInput | ConceptUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: ConceptCreateManyConversationInputEnvelope
    set?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    disconnect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    delete?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    update?: ConceptUpdateWithWhereUniqueWithoutConversationInput | ConceptUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: ConceptUpdateManyWithWhereWithoutConversationInput | ConceptUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: ConceptScalarWhereInput | ConceptScalarWhereInput[]
  }

  export type OccurrenceUpdateManyWithoutConversationNestedInput = {
    create?: XOR<OccurrenceCreateWithoutConversationInput, OccurrenceUncheckedCreateWithoutConversationInput> | OccurrenceCreateWithoutConversationInput[] | OccurrenceUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: OccurrenceCreateOrConnectWithoutConversationInput | OccurrenceCreateOrConnectWithoutConversationInput[]
    upsert?: OccurrenceUpsertWithWhereUniqueWithoutConversationInput | OccurrenceUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: OccurrenceCreateManyConversationInputEnvelope
    set?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    disconnect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    delete?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    connect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    update?: OccurrenceUpdateWithWhereUniqueWithoutConversationInput | OccurrenceUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: OccurrenceUpdateManyWithWhereWithoutConversationInput | OccurrenceUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: OccurrenceScalarWhereInput | OccurrenceScalarWhereInput[]
  }

  export type ConceptUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<ConceptCreateWithoutConversationInput, ConceptUncheckedCreateWithoutConversationInput> | ConceptCreateWithoutConversationInput[] | ConceptUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: ConceptCreateOrConnectWithoutConversationInput | ConceptCreateOrConnectWithoutConversationInput[]
    upsert?: ConceptUpsertWithWhereUniqueWithoutConversationInput | ConceptUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: ConceptCreateManyConversationInputEnvelope
    set?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    disconnect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    delete?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    connect?: ConceptWhereUniqueInput | ConceptWhereUniqueInput[]
    update?: ConceptUpdateWithWhereUniqueWithoutConversationInput | ConceptUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: ConceptUpdateManyWithWhereWithoutConversationInput | ConceptUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: ConceptScalarWhereInput | ConceptScalarWhereInput[]
  }

  export type OccurrenceUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<OccurrenceCreateWithoutConversationInput, OccurrenceUncheckedCreateWithoutConversationInput> | OccurrenceCreateWithoutConversationInput[] | OccurrenceUncheckedCreateWithoutConversationInput[]
    connectOrCreate?: OccurrenceCreateOrConnectWithoutConversationInput | OccurrenceCreateOrConnectWithoutConversationInput[]
    upsert?: OccurrenceUpsertWithWhereUniqueWithoutConversationInput | OccurrenceUpsertWithWhereUniqueWithoutConversationInput[]
    createMany?: OccurrenceCreateManyConversationInputEnvelope
    set?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    disconnect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    delete?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    connect?: OccurrenceWhereUniqueInput | OccurrenceWhereUniqueInput[]
    update?: OccurrenceUpdateWithWhereUniqueWithoutConversationInput | OccurrenceUpdateWithWhereUniqueWithoutConversationInput[]
    updateMany?: OccurrenceUpdateManyWithWhereWithoutConversationInput | OccurrenceUpdateManyWithWhereWithoutConversationInput[]
    deleteMany?: OccurrenceScalarWhereInput | OccurrenceScalarWhereInput[]
  }

  export type ConversationCreateNestedOneWithoutOccurrencesInput = {
    create?: XOR<ConversationCreateWithoutOccurrencesInput, ConversationUncheckedCreateWithoutOccurrencesInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutOccurrencesInput
    connect?: ConversationWhereUniqueInput
  }

  export type ConceptCreateNestedOneWithoutOccurrencesInput = {
    create?: XOR<ConceptCreateWithoutOccurrencesInput, ConceptUncheckedCreateWithoutOccurrencesInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutOccurrencesInput
    connect?: ConceptWhereUniqueInput
  }

  export type ConversationUpdateOneRequiredWithoutOccurrencesNestedInput = {
    create?: XOR<ConversationCreateWithoutOccurrencesInput, ConversationUncheckedCreateWithoutOccurrencesInput>
    connectOrCreate?: ConversationCreateOrConnectWithoutOccurrencesInput
    upsert?: ConversationUpsertWithoutOccurrencesInput
    connect?: ConversationWhereUniqueInput
    update?: XOR<XOR<ConversationUpdateToOneWithWhereWithoutOccurrencesInput, ConversationUpdateWithoutOccurrencesInput>, ConversationUncheckedUpdateWithoutOccurrencesInput>
  }

  export type ConceptUpdateOneRequiredWithoutOccurrencesNestedInput = {
    create?: XOR<ConceptCreateWithoutOccurrencesInput, ConceptUncheckedCreateWithoutOccurrencesInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutOccurrencesInput
    upsert?: ConceptUpsertWithoutOccurrencesInput
    connect?: ConceptWhereUniqueInput
    update?: XOR<XOR<ConceptUpdateToOneWithWhereWithoutOccurrencesInput, ConceptUpdateWithoutOccurrencesInput>, ConceptUncheckedUpdateWithoutOccurrencesInput>
  }

  export type ConceptCreateNestedOneWithoutCodeSnippetsInput = {
    create?: XOR<ConceptCreateWithoutCodeSnippetsInput, ConceptUncheckedCreateWithoutCodeSnippetsInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutCodeSnippetsInput
    connect?: ConceptWhereUniqueInput
  }

  export type ConceptUpdateOneRequiredWithoutCodeSnippetsNestedInput = {
    create?: XOR<ConceptCreateWithoutCodeSnippetsInput, ConceptUncheckedCreateWithoutCodeSnippetsInput>
    connectOrCreate?: ConceptCreateOrConnectWithoutCodeSnippetsInput
    upsert?: ConceptUpsertWithoutCodeSnippetsInput
    connect?: ConceptWhereUniqueInput
    update?: XOR<XOR<ConceptUpdateToOneWithWhereWithoutCodeSnippetsInput, ConceptUpdateWithoutCodeSnippetsInput>, ConceptUncheckedUpdateWithoutCodeSnippetsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type CategoryCreateWithoutChildrenInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    parent?: CategoryCreateNestedOneWithoutChildrenInput
    concepts?: ConceptCreateNestedManyWithoutCategoriesInput
  }

  export type CategoryUncheckedCreateWithoutChildrenInput = {
    id?: string
    name: string
    parentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    concepts?: ConceptUncheckedCreateNestedManyWithoutCategoriesInput
  }

  export type CategoryCreateOrConnectWithoutChildrenInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutChildrenInput, CategoryUncheckedCreateWithoutChildrenInput>
  }

  export type CategoryCreateWithoutParentInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: CategoryCreateNestedManyWithoutParentInput
    concepts?: ConceptCreateNestedManyWithoutCategoriesInput
  }

  export type CategoryUncheckedCreateWithoutParentInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: CategoryUncheckedCreateNestedManyWithoutParentInput
    concepts?: ConceptUncheckedCreateNestedManyWithoutCategoriesInput
  }

  export type CategoryCreateOrConnectWithoutParentInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutParentInput, CategoryUncheckedCreateWithoutParentInput>
  }

  export type CategoryCreateManyParentInputEnvelope = {
    data: CategoryCreateManyParentInput | CategoryCreateManyParentInput[]
  }

  export type ConceptCreateWithoutCategoriesInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
    codeSnippets?: CodeSnippetCreateNestedManyWithoutConceptInput
    conversation: ConversationCreateNestedOneWithoutConceptsInput
    occurrences?: OccurrenceCreateNestedManyWithoutConceptInput
  }

  export type ConceptUncheckedCreateWithoutCategoriesInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
    conversationId: string
    codeSnippets?: CodeSnippetUncheckedCreateNestedManyWithoutConceptInput
    occurrences?: OccurrenceUncheckedCreateNestedManyWithoutConceptInput
  }

  export type ConceptCreateOrConnectWithoutCategoriesInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutCategoriesInput, ConceptUncheckedCreateWithoutCategoriesInput>
  }

  export type CategoryUpsertWithoutChildrenInput = {
    update: XOR<CategoryUpdateWithoutChildrenInput, CategoryUncheckedUpdateWithoutChildrenInput>
    create: XOR<CategoryCreateWithoutChildrenInput, CategoryUncheckedCreateWithoutChildrenInput>
    where?: CategoryWhereInput
  }

  export type CategoryUpdateToOneWithWhereWithoutChildrenInput = {
    where?: CategoryWhereInput
    data: XOR<CategoryUpdateWithoutChildrenInput, CategoryUncheckedUpdateWithoutChildrenInput>
  }

  export type CategoryUpdateWithoutChildrenInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parent?: CategoryUpdateOneWithoutChildrenNestedInput
    concepts?: ConceptUpdateManyWithoutCategoriesNestedInput
  }

  export type CategoryUncheckedUpdateWithoutChildrenInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    concepts?: ConceptUncheckedUpdateManyWithoutCategoriesNestedInput
  }

  export type CategoryUpsertWithWhereUniqueWithoutParentInput = {
    where: CategoryWhereUniqueInput
    update: XOR<CategoryUpdateWithoutParentInput, CategoryUncheckedUpdateWithoutParentInput>
    create: XOR<CategoryCreateWithoutParentInput, CategoryUncheckedCreateWithoutParentInput>
  }

  export type CategoryUpdateWithWhereUniqueWithoutParentInput = {
    where: CategoryWhereUniqueInput
    data: XOR<CategoryUpdateWithoutParentInput, CategoryUncheckedUpdateWithoutParentInput>
  }

  export type CategoryUpdateManyWithWhereWithoutParentInput = {
    where: CategoryScalarWhereInput
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyWithoutParentInput>
  }

  export type CategoryScalarWhereInput = {
    AND?: CategoryScalarWhereInput | CategoryScalarWhereInput[]
    OR?: CategoryScalarWhereInput[]
    NOT?: CategoryScalarWhereInput | CategoryScalarWhereInput[]
    id?: StringFilter<"Category"> | string
    name?: StringFilter<"Category"> | string
    parentId?: StringNullableFilter<"Category"> | string | null
    createdAt?: DateTimeFilter<"Category"> | Date | string
    updatedAt?: DateTimeFilter<"Category"> | Date | string
  }

  export type ConceptUpsertWithWhereUniqueWithoutCategoriesInput = {
    where: ConceptWhereUniqueInput
    update: XOR<ConceptUpdateWithoutCategoriesInput, ConceptUncheckedUpdateWithoutCategoriesInput>
    create: XOR<ConceptCreateWithoutCategoriesInput, ConceptUncheckedCreateWithoutCategoriesInput>
  }

  export type ConceptUpdateWithWhereUniqueWithoutCategoriesInput = {
    where: ConceptWhereUniqueInput
    data: XOR<ConceptUpdateWithoutCategoriesInput, ConceptUncheckedUpdateWithoutCategoriesInput>
  }

  export type ConceptUpdateManyWithWhereWithoutCategoriesInput = {
    where: ConceptScalarWhereInput
    data: XOR<ConceptUpdateManyMutationInput, ConceptUncheckedUpdateManyWithoutCategoriesInput>
  }

  export type ConceptScalarWhereInput = {
    AND?: ConceptScalarWhereInput | ConceptScalarWhereInput[]
    OR?: ConceptScalarWhereInput[]
    NOT?: ConceptScalarWhereInput | ConceptScalarWhereInput[]
    id?: StringFilter<"Concept"> | string
    title?: StringFilter<"Concept"> | string
    category?: StringFilter<"Concept"> | string
    summary?: StringFilter<"Concept"> | string
    details?: StringFilter<"Concept"> | string
    keyPoints?: StringFilter<"Concept"> | string
    examples?: StringFilter<"Concept"> | string
    relatedConcepts?: StringFilter<"Concept"> | string
    relationships?: StringFilter<"Concept"> | string
    confidenceScore?: FloatFilter<"Concept"> | number
    lastUpdated?: DateTimeFilter<"Concept"> | Date | string
    conversationId?: StringFilter<"Concept"> | string
  }

  export type CodeSnippetCreateWithoutConceptInput = {
    id?: string
    language: string
    description: string
    code: string
  }

  export type CodeSnippetUncheckedCreateWithoutConceptInput = {
    id?: string
    language: string
    description: string
    code: string
  }

  export type CodeSnippetCreateOrConnectWithoutConceptInput = {
    where: CodeSnippetWhereUniqueInput
    create: XOR<CodeSnippetCreateWithoutConceptInput, CodeSnippetUncheckedCreateWithoutConceptInput>
  }

  export type CodeSnippetCreateManyConceptInputEnvelope = {
    data: CodeSnippetCreateManyConceptInput | CodeSnippetCreateManyConceptInput[]
  }

  export type ConversationCreateWithoutConceptsInput = {
    id?: string
    text: string
    summary: string
    createdAt?: Date | string
    occurrences?: OccurrenceCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutConceptsInput = {
    id?: string
    text: string
    summary: string
    createdAt?: Date | string
    occurrences?: OccurrenceUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutConceptsInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutConceptsInput, ConversationUncheckedCreateWithoutConceptsInput>
  }

  export type CategoryCreateWithoutConceptsInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    parent?: CategoryCreateNestedOneWithoutChildrenInput
    children?: CategoryCreateNestedManyWithoutParentInput
  }

  export type CategoryUncheckedCreateWithoutConceptsInput = {
    id?: string
    name: string
    parentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: CategoryUncheckedCreateNestedManyWithoutParentInput
  }

  export type CategoryCreateOrConnectWithoutConceptsInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutConceptsInput, CategoryUncheckedCreateWithoutConceptsInput>
  }

  export type OccurrenceCreateWithoutConceptInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    conversation: ConversationCreateNestedOneWithoutOccurrencesInput
  }

  export type OccurrenceUncheckedCreateWithoutConceptInput = {
    id?: string
    conversationId: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OccurrenceCreateOrConnectWithoutConceptInput = {
    where: OccurrenceWhereUniqueInput
    create: XOR<OccurrenceCreateWithoutConceptInput, OccurrenceUncheckedCreateWithoutConceptInput>
  }

  export type OccurrenceCreateManyConceptInputEnvelope = {
    data: OccurrenceCreateManyConceptInput | OccurrenceCreateManyConceptInput[]
  }

  export type CodeSnippetUpsertWithWhereUniqueWithoutConceptInput = {
    where: CodeSnippetWhereUniqueInput
    update: XOR<CodeSnippetUpdateWithoutConceptInput, CodeSnippetUncheckedUpdateWithoutConceptInput>
    create: XOR<CodeSnippetCreateWithoutConceptInput, CodeSnippetUncheckedCreateWithoutConceptInput>
  }

  export type CodeSnippetUpdateWithWhereUniqueWithoutConceptInput = {
    where: CodeSnippetWhereUniqueInput
    data: XOR<CodeSnippetUpdateWithoutConceptInput, CodeSnippetUncheckedUpdateWithoutConceptInput>
  }

  export type CodeSnippetUpdateManyWithWhereWithoutConceptInput = {
    where: CodeSnippetScalarWhereInput
    data: XOR<CodeSnippetUpdateManyMutationInput, CodeSnippetUncheckedUpdateManyWithoutConceptInput>
  }

  export type CodeSnippetScalarWhereInput = {
    AND?: CodeSnippetScalarWhereInput | CodeSnippetScalarWhereInput[]
    OR?: CodeSnippetScalarWhereInput[]
    NOT?: CodeSnippetScalarWhereInput | CodeSnippetScalarWhereInput[]
    id?: StringFilter<"CodeSnippet"> | string
    language?: StringFilter<"CodeSnippet"> | string
    description?: StringFilter<"CodeSnippet"> | string
    code?: StringFilter<"CodeSnippet"> | string
    conceptId?: StringFilter<"CodeSnippet"> | string
  }

  export type ConversationUpsertWithoutConceptsInput = {
    update: XOR<ConversationUpdateWithoutConceptsInput, ConversationUncheckedUpdateWithoutConceptsInput>
    create: XOR<ConversationCreateWithoutConceptsInput, ConversationUncheckedCreateWithoutConceptsInput>
    where?: ConversationWhereInput
  }

  export type ConversationUpdateToOneWithWhereWithoutConceptsInput = {
    where?: ConversationWhereInput
    data: XOR<ConversationUpdateWithoutConceptsInput, ConversationUncheckedUpdateWithoutConceptsInput>
  }

  export type ConversationUpdateWithoutConceptsInput = {
    id?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    occurrences?: OccurrenceUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutConceptsInput = {
    id?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    occurrences?: OccurrenceUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type CategoryUpsertWithWhereUniqueWithoutConceptsInput = {
    where: CategoryWhereUniqueInput
    update: XOR<CategoryUpdateWithoutConceptsInput, CategoryUncheckedUpdateWithoutConceptsInput>
    create: XOR<CategoryCreateWithoutConceptsInput, CategoryUncheckedCreateWithoutConceptsInput>
  }

  export type CategoryUpdateWithWhereUniqueWithoutConceptsInput = {
    where: CategoryWhereUniqueInput
    data: XOR<CategoryUpdateWithoutConceptsInput, CategoryUncheckedUpdateWithoutConceptsInput>
  }

  export type CategoryUpdateManyWithWhereWithoutConceptsInput = {
    where: CategoryScalarWhereInput
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyWithoutConceptsInput>
  }

  export type OccurrenceUpsertWithWhereUniqueWithoutConceptInput = {
    where: OccurrenceWhereUniqueInput
    update: XOR<OccurrenceUpdateWithoutConceptInput, OccurrenceUncheckedUpdateWithoutConceptInput>
    create: XOR<OccurrenceCreateWithoutConceptInput, OccurrenceUncheckedCreateWithoutConceptInput>
  }

  export type OccurrenceUpdateWithWhereUniqueWithoutConceptInput = {
    where: OccurrenceWhereUniqueInput
    data: XOR<OccurrenceUpdateWithoutConceptInput, OccurrenceUncheckedUpdateWithoutConceptInput>
  }

  export type OccurrenceUpdateManyWithWhereWithoutConceptInput = {
    where: OccurrenceScalarWhereInput
    data: XOR<OccurrenceUpdateManyMutationInput, OccurrenceUncheckedUpdateManyWithoutConceptInput>
  }

  export type OccurrenceScalarWhereInput = {
    AND?: OccurrenceScalarWhereInput | OccurrenceScalarWhereInput[]
    OR?: OccurrenceScalarWhereInput[]
    NOT?: OccurrenceScalarWhereInput | OccurrenceScalarWhereInput[]
    id?: StringFilter<"Occurrence"> | string
    conversationId?: StringFilter<"Occurrence"> | string
    conceptId?: StringFilter<"Occurrence"> | string
    notes?: StringNullableFilter<"Occurrence"> | string | null
    createdAt?: DateTimeFilter<"Occurrence"> | Date | string
    updatedAt?: DateTimeFilter<"Occurrence"> | Date | string
  }

  export type ConceptCreateWithoutConversationInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
    codeSnippets?: CodeSnippetCreateNestedManyWithoutConceptInput
    categories?: CategoryCreateNestedManyWithoutConceptsInput
    occurrences?: OccurrenceCreateNestedManyWithoutConceptInput
  }

  export type ConceptUncheckedCreateWithoutConversationInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
    codeSnippets?: CodeSnippetUncheckedCreateNestedManyWithoutConceptInput
    categories?: CategoryUncheckedCreateNestedManyWithoutConceptsInput
    occurrences?: OccurrenceUncheckedCreateNestedManyWithoutConceptInput
  }

  export type ConceptCreateOrConnectWithoutConversationInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutConversationInput, ConceptUncheckedCreateWithoutConversationInput>
  }

  export type ConceptCreateManyConversationInputEnvelope = {
    data: ConceptCreateManyConversationInput | ConceptCreateManyConversationInput[]
  }

  export type OccurrenceCreateWithoutConversationInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    concept: ConceptCreateNestedOneWithoutOccurrencesInput
  }

  export type OccurrenceUncheckedCreateWithoutConversationInput = {
    id?: string
    conceptId: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OccurrenceCreateOrConnectWithoutConversationInput = {
    where: OccurrenceWhereUniqueInput
    create: XOR<OccurrenceCreateWithoutConversationInput, OccurrenceUncheckedCreateWithoutConversationInput>
  }

  export type OccurrenceCreateManyConversationInputEnvelope = {
    data: OccurrenceCreateManyConversationInput | OccurrenceCreateManyConversationInput[]
  }

  export type ConceptUpsertWithWhereUniqueWithoutConversationInput = {
    where: ConceptWhereUniqueInput
    update: XOR<ConceptUpdateWithoutConversationInput, ConceptUncheckedUpdateWithoutConversationInput>
    create: XOR<ConceptCreateWithoutConversationInput, ConceptUncheckedCreateWithoutConversationInput>
  }

  export type ConceptUpdateWithWhereUniqueWithoutConversationInput = {
    where: ConceptWhereUniqueInput
    data: XOR<ConceptUpdateWithoutConversationInput, ConceptUncheckedUpdateWithoutConversationInput>
  }

  export type ConceptUpdateManyWithWhereWithoutConversationInput = {
    where: ConceptScalarWhereInput
    data: XOR<ConceptUpdateManyMutationInput, ConceptUncheckedUpdateManyWithoutConversationInput>
  }

  export type OccurrenceUpsertWithWhereUniqueWithoutConversationInput = {
    where: OccurrenceWhereUniqueInput
    update: XOR<OccurrenceUpdateWithoutConversationInput, OccurrenceUncheckedUpdateWithoutConversationInput>
    create: XOR<OccurrenceCreateWithoutConversationInput, OccurrenceUncheckedCreateWithoutConversationInput>
  }

  export type OccurrenceUpdateWithWhereUniqueWithoutConversationInput = {
    where: OccurrenceWhereUniqueInput
    data: XOR<OccurrenceUpdateWithoutConversationInput, OccurrenceUncheckedUpdateWithoutConversationInput>
  }

  export type OccurrenceUpdateManyWithWhereWithoutConversationInput = {
    where: OccurrenceScalarWhereInput
    data: XOR<OccurrenceUpdateManyMutationInput, OccurrenceUncheckedUpdateManyWithoutConversationInput>
  }

  export type ConversationCreateWithoutOccurrencesInput = {
    id?: string
    text: string
    summary: string
    createdAt?: Date | string
    concepts?: ConceptCreateNestedManyWithoutConversationInput
  }

  export type ConversationUncheckedCreateWithoutOccurrencesInput = {
    id?: string
    text: string
    summary: string
    createdAt?: Date | string
    concepts?: ConceptUncheckedCreateNestedManyWithoutConversationInput
  }

  export type ConversationCreateOrConnectWithoutOccurrencesInput = {
    where: ConversationWhereUniqueInput
    create: XOR<ConversationCreateWithoutOccurrencesInput, ConversationUncheckedCreateWithoutOccurrencesInput>
  }

  export type ConceptCreateWithoutOccurrencesInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
    codeSnippets?: CodeSnippetCreateNestedManyWithoutConceptInput
    conversation: ConversationCreateNestedOneWithoutConceptsInput
    categories?: CategoryCreateNestedManyWithoutConceptsInput
  }

  export type ConceptUncheckedCreateWithoutOccurrencesInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
    conversationId: string
    codeSnippets?: CodeSnippetUncheckedCreateNestedManyWithoutConceptInput
    categories?: CategoryUncheckedCreateNestedManyWithoutConceptsInput
  }

  export type ConceptCreateOrConnectWithoutOccurrencesInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutOccurrencesInput, ConceptUncheckedCreateWithoutOccurrencesInput>
  }

  export type ConversationUpsertWithoutOccurrencesInput = {
    update: XOR<ConversationUpdateWithoutOccurrencesInput, ConversationUncheckedUpdateWithoutOccurrencesInput>
    create: XOR<ConversationCreateWithoutOccurrencesInput, ConversationUncheckedCreateWithoutOccurrencesInput>
    where?: ConversationWhereInput
  }

  export type ConversationUpdateToOneWithWhereWithoutOccurrencesInput = {
    where?: ConversationWhereInput
    data: XOR<ConversationUpdateWithoutOccurrencesInput, ConversationUncheckedUpdateWithoutOccurrencesInput>
  }

  export type ConversationUpdateWithoutOccurrencesInput = {
    id?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    concepts?: ConceptUpdateManyWithoutConversationNestedInput
  }

  export type ConversationUncheckedUpdateWithoutOccurrencesInput = {
    id?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    concepts?: ConceptUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type ConceptUpsertWithoutOccurrencesInput = {
    update: XOR<ConceptUpdateWithoutOccurrencesInput, ConceptUncheckedUpdateWithoutOccurrencesInput>
    create: XOR<ConceptCreateWithoutOccurrencesInput, ConceptUncheckedCreateWithoutOccurrencesInput>
    where?: ConceptWhereInput
  }

  export type ConceptUpdateToOneWithWhereWithoutOccurrencesInput = {
    where?: ConceptWhereInput
    data: XOR<ConceptUpdateWithoutOccurrencesInput, ConceptUncheckedUpdateWithoutOccurrencesInput>
  }

  export type ConceptUpdateWithoutOccurrencesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    codeSnippets?: CodeSnippetUpdateManyWithoutConceptNestedInput
    conversation?: ConversationUpdateOneRequiredWithoutConceptsNestedInput
    categories?: CategoryUpdateManyWithoutConceptsNestedInput
  }

  export type ConceptUncheckedUpdateWithoutOccurrencesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    codeSnippets?: CodeSnippetUncheckedUpdateManyWithoutConceptNestedInput
    categories?: CategoryUncheckedUpdateManyWithoutConceptsNestedInput
  }

  export type ConceptCreateWithoutCodeSnippetsInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
    conversation: ConversationCreateNestedOneWithoutConceptsInput
    categories?: CategoryCreateNestedManyWithoutConceptsInput
    occurrences?: OccurrenceCreateNestedManyWithoutConceptInput
  }

  export type ConceptUncheckedCreateWithoutCodeSnippetsInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
    conversationId: string
    categories?: CategoryUncheckedCreateNestedManyWithoutConceptsInput
    occurrences?: OccurrenceUncheckedCreateNestedManyWithoutConceptInput
  }

  export type ConceptCreateOrConnectWithoutCodeSnippetsInput = {
    where: ConceptWhereUniqueInput
    create: XOR<ConceptCreateWithoutCodeSnippetsInput, ConceptUncheckedCreateWithoutCodeSnippetsInput>
  }

  export type ConceptUpsertWithoutCodeSnippetsInput = {
    update: XOR<ConceptUpdateWithoutCodeSnippetsInput, ConceptUncheckedUpdateWithoutCodeSnippetsInput>
    create: XOR<ConceptCreateWithoutCodeSnippetsInput, ConceptUncheckedCreateWithoutCodeSnippetsInput>
    where?: ConceptWhereInput
  }

  export type ConceptUpdateToOneWithWhereWithoutCodeSnippetsInput = {
    where?: ConceptWhereInput
    data: XOR<ConceptUpdateWithoutCodeSnippetsInput, ConceptUncheckedUpdateWithoutCodeSnippetsInput>
  }

  export type ConceptUpdateWithoutCodeSnippetsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutConceptsNestedInput
    categories?: CategoryUpdateManyWithoutConceptsNestedInput
    occurrences?: OccurrenceUpdateManyWithoutConceptNestedInput
  }

  export type ConceptUncheckedUpdateWithoutCodeSnippetsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    categories?: CategoryUncheckedUpdateManyWithoutConceptsNestedInput
    occurrences?: OccurrenceUncheckedUpdateManyWithoutConceptNestedInput
  }

  export type CategoryCreateManyParentInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CategoryUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: CategoryUpdateManyWithoutParentNestedInput
    concepts?: ConceptUpdateManyWithoutCategoriesNestedInput
  }

  export type CategoryUncheckedUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: CategoryUncheckedUpdateManyWithoutParentNestedInput
    concepts?: ConceptUncheckedUpdateManyWithoutCategoriesNestedInput
  }

  export type CategoryUncheckedUpdateManyWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConceptUpdateWithoutCategoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    codeSnippets?: CodeSnippetUpdateManyWithoutConceptNestedInput
    conversation?: ConversationUpdateOneRequiredWithoutConceptsNestedInput
    occurrences?: OccurrenceUpdateManyWithoutConceptNestedInput
  }

  export type ConceptUncheckedUpdateWithoutCategoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
    codeSnippets?: CodeSnippetUncheckedUpdateManyWithoutConceptNestedInput
    occurrences?: OccurrenceUncheckedUpdateManyWithoutConceptNestedInput
  }

  export type ConceptUncheckedUpdateManyWithoutCategoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    conversationId?: StringFieldUpdateOperationsInput | string
  }

  export type CodeSnippetCreateManyConceptInput = {
    id?: string
    language: string
    description: string
    code: string
  }

  export type OccurrenceCreateManyConceptInput = {
    id?: string
    conversationId: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CodeSnippetUpdateWithoutConceptInput = {
    id?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
  }

  export type CodeSnippetUncheckedUpdateWithoutConceptInput = {
    id?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
  }

  export type CodeSnippetUncheckedUpdateManyWithoutConceptInput = {
    id?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
  }

  export type CategoryUpdateWithoutConceptsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parent?: CategoryUpdateOneWithoutChildrenNestedInput
    children?: CategoryUpdateManyWithoutParentNestedInput
  }

  export type CategoryUncheckedUpdateWithoutConceptsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: CategoryUncheckedUpdateManyWithoutParentNestedInput
  }

  export type CategoryUncheckedUpdateManyWithoutConceptsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OccurrenceUpdateWithoutConceptInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    conversation?: ConversationUpdateOneRequiredWithoutOccurrencesNestedInput
  }

  export type OccurrenceUncheckedUpdateWithoutConceptInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OccurrenceUncheckedUpdateManyWithoutConceptInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConceptCreateManyConversationInput = {
    id?: string
    title: string
    category: string
    summary: string
    details: string
    keyPoints: string
    examples: string
    relatedConcepts: string
    relationships: string
    confidenceScore: number
    lastUpdated: Date | string
  }

  export type OccurrenceCreateManyConversationInput = {
    id?: string
    conceptId: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConceptUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    codeSnippets?: CodeSnippetUpdateManyWithoutConceptNestedInput
    categories?: CategoryUpdateManyWithoutConceptsNestedInput
    occurrences?: OccurrenceUpdateManyWithoutConceptNestedInput
  }

  export type ConceptUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    codeSnippets?: CodeSnippetUncheckedUpdateManyWithoutConceptNestedInput
    categories?: CategoryUncheckedUpdateManyWithoutConceptsNestedInput
    occurrences?: OccurrenceUncheckedUpdateManyWithoutConceptNestedInput
  }

  export type ConceptUncheckedUpdateManyWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    summary?: StringFieldUpdateOperationsInput | string
    details?: StringFieldUpdateOperationsInput | string
    keyPoints?: StringFieldUpdateOperationsInput | string
    examples?: StringFieldUpdateOperationsInput | string
    relatedConcepts?: StringFieldUpdateOperationsInput | string
    relationships?: StringFieldUpdateOperationsInput | string
    confidenceScore?: FloatFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OccurrenceUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    concept?: ConceptUpdateOneRequiredWithoutOccurrencesNestedInput
  }

  export type OccurrenceUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    conceptId?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OccurrenceUncheckedUpdateManyWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    conceptId?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}