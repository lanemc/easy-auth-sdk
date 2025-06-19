import os from 'os';
import fs from 'fs';
import net from 'net';
import tls from 'tls';
import crypto from 'crypto';
import Stream from 'stream';
import { performance } from 'perf_hooks';
import crypto$1 from 'node:crypto';
import fs$1 from 'node:fs';
import path from 'node:path';
import { relations, sql as sql$1, eq as eq$1, and as and$1, gt as gt$1 } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';

const entityKind = Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = value.constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

class ConsoleLogWriter {
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
}
class DefaultLogger {
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
}
class NoopLogger {
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
}

class QueryPromise {
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

const TableName = Symbol.for("drizzle:Name");
const Schema = Symbol.for("drizzle:Schema");
const Columns = Symbol.for("drizzle:Columns");
const OriginalName = Symbol.for("drizzle:OriginalName");
const BaseName = Symbol.for("drizzle:BaseName");
const IsAlias = Symbol.for("drizzle:IsAlias");
const ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
const IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
class Table {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  [IsDrizzleTable] = true;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
}
function isTable(table) {
  return typeof table === "object" && table !== null && IsDrizzleTable in table;
}
function getTableName(table) {
  return table[TableName];
}

function iife(fn, ...args) {
  return fn(...args);
}

const tracer = {
  startActiveSpan(name, fn) {
    {
      return fn();
    }
  }
};

class Column {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
  }
  static [entityKind] = "Column";
  name;
  primary;
  notNull;
  default;
  defaultFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
}

const SubqueryConfig = Symbol.for("drizzle:SubqueryConfig");
class Subquery {
  static [entityKind] = "Subquery";
  /** @internal */
  [SubqueryConfig];
  constructor(sql, selection, alias, isWith = false) {
    this[SubqueryConfig] = {
      sql,
      selection,
      alias,
      isWith
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
}
class WithSubquery extends Subquery {
  static [entityKind] = "WithSubquery";
}

const ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

function isSQLWrapper(value) {
  return typeof value === "object" && value !== null && "getSQL" in value && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
class StringChunk {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
}
class SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        return { sql: escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(chunk.name), params: [] };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings;
        if (prepareTyping !== void 0) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk] };
      }
      if (is(chunk, SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk[SubqueryConfig].isWith) {
          return { sql: escapeName(chunk[SubqueryConfig].alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk[SubqueryConfig].sql,
          new StringChunk(") "),
          new Name(chunk[SubqueryConfig].alias)
        ], config);
      }
      if (isSQLWrapper(chunk)) {
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
}
class Name {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
const noopDecoder = {
  mapFromDriverValue: (value) => value
};
const noopEncoder = {
  mapToDriverValue: (value) => value
};
({
  ...noopDecoder,
  ...noopEncoder
});
class Param {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
class Placeholder {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
}
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    return p;
  });
}
class View {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
}
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index, key] of leftKeys.entries()) {
    if (key !== rightKeys[index]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor")
        continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table[SubqueryConfig].alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}

class PgDeleteBase extends QueryPromise {
  constructor(table, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "PgDelete";
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * await db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * await db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * await db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues);
    });
  };
  $dynamic() {
    return this;
  }
}

class PgInsertBuilder {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "PgInsertBuilder";
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new PgInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
  }
}
class PgInsertBase extends QueryPromise {
  constructor(table, values, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList };
  }
  static [entityKind] = "PgInsert";
  config;
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (config.target === void 0) {
      this.config.onConflict = sql`do nothing`;
    } else {
      let targetColumn = "";
      targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(it.name)).join(",") : this.dialect.escapeName(config.target.name);
      const whereSql = config.where ? sql` where ${config.where}` : void 0;
      this.config.onConflict = sql`(${sql.raw(targetColumn)}) do nothing${whereSql}`;
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    let targetColumn = "";
    targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(it.name)).join(",") : this.dialect.escapeName(config.target.name);
    this.config.onConflict = sql`(${sql.raw(targetColumn)}) do update set ${setSql}${whereSql}`;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues);
    });
  };
  $dynamic() {
    return this;
  }
}

class ColumnAliasProxyHandler {
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
}
class TableAliasProxyHandler {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
}
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}

class DrizzleError extends Error {
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
}
class TransactionRollbackError extends DrizzleError {
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
}

class ColumnBuilder {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
}

const InlineForeignKeys = Symbol.for("drizzle:PgInlineForeignKeys");
class PgTable extends Table {
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
}
function pgTableWithSchema(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new PgTable(name, schema, baseName);
  const builtColumns = Object.fromEntries(
    Object.entries(columns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  if (extraConfig) {
    table[PgTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
const pgTable = (name, columns, extraConfig) => {
  return pgTableWithSchema(name, columns, extraConfig, void 0);
};

class ForeignKeyBuilder {
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
}
class ForeignKey {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[PgTable.Symbol.Name],
      ...columnNames,
      foreignColumns[0].table[PgTable.Symbol.Name],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
}

function unique(name) {
  return new UniqueOnConstraintBuilder(name);
}
function uniqueKeyName(table, columns) {
  return `${table[PgTable.Symbol.Name]}_${columns.join("_")}_unique`;
}
class UniqueConstraintBuilder {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
}
class UniqueOnConstraintBuilder {
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
}
class UniqueConstraint {
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
}

function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

class PgColumnBuilder extends ColumnBuilder {
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
}
class PgColumn extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
}
class PgArrayBuilder extends PgColumnBuilder {
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
}
class PgArray extends PgColumn {
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray)
      return a;
    return makePgArray(a);
  }
}

class PgBooleanBuilder extends PgColumnBuilder {
  static [entityKind] = "PgBooleanBuilder";
  constructor(name) {
    super(name, "boolean", "PgBoolean");
  }
  /** @internal */
  build(table) {
    return new PgBoolean(table, this.config);
  }
}
class PgBoolean extends PgColumn {
  static [entityKind] = "PgBoolean";
  getSQLType() {
    return "boolean";
  }
}
function boolean(name) {
  return new PgBooleanBuilder(name);
}

class PgDateColumnBaseBuilder extends PgColumnBuilder {
  static [entityKind] = "PgDateColumnBaseBuilder";
  defaultNow() {
    return this.default(sql`now()`);
  }
}

class PgDate extends PgColumn {
  static [entityKind] = "PgDate";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    return new Date(value);
  }
  mapToDriverValue(value) {
    return value.toISOString();
  }
}

class PgIntegerBuilder extends PgColumnBuilder {
  static [entityKind] = "PgIntegerBuilder";
  constructor(name) {
    super(name, "number", "PgInteger");
  }
  /** @internal */
  build(table) {
    return new PgInteger(table, this.config);
  }
}
class PgInteger extends PgColumn {
  static [entityKind] = "PgInteger";
  getSQLType() {
    return "integer";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseInt(value);
    }
    return value;
  }
}
function integer(name) {
  return new PgIntegerBuilder(name);
}

class PgJson extends PgColumn {
  static [entityKind] = "PgJson";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "json";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
}

class PgJsonb extends PgColumn {
  static [entityKind] = "PgJsonb";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "jsonb";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
}

class PgNumeric extends PgColumn {
  static [entityKind] = "PgNumeric";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
}

class PgTextBuilder extends PgColumnBuilder {
  static [entityKind] = "PgTextBuilder";
  constructor(name, config) {
    super(name, "string", "PgText");
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgText(table, this.config);
  }
}
class PgText extends PgColumn {
  static [entityKind] = "PgText";
  enumValues = this.config.enumValues;
  getSQLType() {
    return "text";
  }
}
function text(name, config = {}) {
  return new PgTextBuilder(name, config);
}

class PgTime extends PgColumn {
  static [entityKind] = "PgTime";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `time${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
}

class PgTimestampBuilder extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "date", "PgTimestamp");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestamp(table, this.config);
  }
}
class PgTimestamp extends PgColumn {
  static [entityKind] = "PgTimestamp";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : ` (${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue = (value) => {
    return new Date(this.withTimezone ? value : value + "+0000");
  };
  mapToDriverValue = (value) => {
    return this.withTimezone ? value.toUTCString() : value.toISOString();
  };
}
class PgTimestampStringBuilder extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampStringBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTimestampString");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestampString(
      table,
      this.config
    );
  }
}
class PgTimestampString extends PgColumn {
  static [entityKind] = "PgTimestampString";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
}
function timestamp(name, config = {}) {
  if (config.mode === "string") {
    return new PgTimestampStringBuilder(name, config.withTimezone ?? false, config.precision);
  }
  return new PgTimestampBuilder(name, config.withTimezone ?? false, config.precision);
}

class PgUUID extends PgColumn {
  static [entityKind] = "PgUUID";
  getSQLType() {
    return "uuid";
  }
}

class PrimaryKeyBuilder {
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
}
class PrimaryKey {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
}

function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
const eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
const ne = (left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
const gt = (left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
};
const gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
const lt = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
const lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      throw new Error("inArray requires at least one value");
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      throw new Error("notInArray requires at least one value");
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}

function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

class Relation {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
}
class Relations {
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
}
class One extends Relation {
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
}
class Many extends Relation {
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
}
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (isTable(value)) {
      const dbName = value[Table.Symbol.Name];
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = value.table[Table.Symbol.Name];
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function createOne(sourceTable) {
  return function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[relation.referencedTable[Table.Symbol.Name]];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[sourceTable[Table.Symbol.Name]];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}

class PgViewBase extends View {
  static [entityKind] = "PgViewBase";
}

class PgDialect {
  static [entityKind] = "PgDialect";
  async migrate(migrations, session, config) {
    const migrationsTable = typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationsSchema = typeof config === "string" ? "drizzle" : config.migrationsSchema ?? "drizzle";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`;
    await session.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(migrationsSchema)}`);
    await session.execute(migrationTableCreate);
    const dbMigrations = await session.all(
      sql`select id, hash, created_at from ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} order by created_at desc limit 1`
    );
    const lastDbMigration = dbMigrations[0];
    await session.transaction(async (tx) => {
      for await (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.execute(sql.raw(stmt));
          }
          await tx.execute(
            sql`insert into ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} ("hash", "created_at") values(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
  escapeName(name) {
    return `"${name}"`;
  }
  escapeParam(num) {
    return `$${num + 1}`;
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length)
      return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w[SubqueryConfig].alias)} as (${w[SubqueryConfig].sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}`;
  }
  buildUpdateSet(table, set) {
    const setEntries = Object.entries(set);
    const setSize = setEntries.length;
    return sql.join(
      setEntries.flatMap(([colName, value], i) => {
        const col = table[Table.Symbol.Columns][colName];
        const res = sql`${sql.identifier(col.name)} = ${value}`;
        if (i < setSize - 1) {
          return [res, sql.raw(", ")];
        }
        return [res];
      })
    );
  }
  buildUpdateQuery({ table, set, where, returning, withList }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}update ${table} set ${setSql}${whereSql}${returningSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, PgColumn)) {
                  return sql.identifier(c.name);
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        if (isSingleTable) {
          chunk.push(sql.identifier(field.name));
        } else {
          chunk.push(field);
        }
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    lockingClause,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table[SubqueryConfig].alias : is(table, PgViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    let distinctSql;
    if (distinct) {
      distinctSql = distinct === true ? sql` distinct` : sql` distinct on (${sql.join(distinct.on, sql`, `)})`;
    }
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = (() => {
      if (is(table, Table) && table[Table.Symbol.OriginalName] !== table[Table.Symbol.Name]) {
        let fullName = sql`${sql.identifier(table[Table.Symbol.OriginalName])}`;
        if (table[Table.Symbol.Schema]) {
          fullName = sql`${sql.identifier(table[Table.Symbol.Schema])}.${fullName}`;
        }
        return sql`${fullName} ${sql.identifier(table[Table.Symbol.Name])}`;
      }
      return table;
    })();
    const joinsArray = [];
    if (joins) {
      for (const [index, joinMeta] of joins.entries()) {
        if (index === 0) {
          joinsArray.push(sql` `);
        }
        const table2 = joinMeta.table;
        const lateralSql = joinMeta.lateral ? sql` lateral` : void 0;
        if (is(table2, PgTable)) {
          const tableName = table2[PgTable.Symbol.Name];
          const tableSchema = table2[PgTable.Symbol.Schema];
          const origTableName = table2[PgTable.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`} on ${joinMeta.on}`
          );
        } else if (is(table2, View)) {
          const viewName = table2[ViewBaseConfig].name;
          const viewSchema = table2[ViewBaseConfig].schema;
          const origViewName = table2[ViewBaseConfig].originalName;
          const alias = viewName === origViewName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${viewSchema ? sql`${sql.identifier(viewSchema)}.` : void 0}${sql.identifier(origViewName)}${alias && sql` ${sql.identifier(alias)}`} on ${joinMeta.on}`
          );
        } else {
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${table2} on ${joinMeta.on}`
          );
        }
        if (index < joins.length - 1) {
          joinsArray.push(sql` `);
        }
      }
    }
    const joinsSql = sql.join(joinsArray);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      orderBySql = sql` order by ${sql.join(orderBy, sql`, `)}`;
    }
    let groupBySql;
    if (groupBy && groupBy.length > 0) {
      groupBySql = sql` group by ${sql.join(groupBy, sql`, `)}`;
    }
    const limitSql = limit ? sql` limit ${limit}` : void 0;
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const lockingClauseSql = sql.empty();
    if (lockingClause) {
      const clauseSql = sql` for ${sql.raw(lockingClause.strength)}`;
      if (lockingClause.config.of) {
        clauseSql.append(
          sql` of ${sql.join(
            Array.isArray(lockingClause.config.of) ? lockingClause.config.of : [lockingClause.config.of],
            sql`, `
          )}`
        );
      }
      if (lockingClause.config.noWait) {
        clauseSql.append(sql` no wait`);
      } else if (lockingClause.config.skipLocked) {
        clauseSql.append(sql` skip locked`);
      }
      lockingClauseSql.append(clauseSql);
    }
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}${lockingClauseSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`(${leftSelect.getSQL()}) `;
    const rightChunk = sql`(${rightSelect.getSQL()})`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, PgColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, PgColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(chunk.name);
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)} `;
    }
    const limitSql = limit ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values, onConflict, returning, withList }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns);
    const insertOrder = colEntries.map(([, column]) => sql.identifier(column.name));
    for (const [valueIndex, value] of values.entries()) {
      const valueList = [];
      for (const [fieldName, col] of colEntries) {
        const colValue = value[fieldName];
        if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
          if (col.defaultFn !== void 0) {
            const defaultFnResult = col.defaultFn();
            const defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
            valueList.push(defaultValue);
          } else {
            valueList.push(sql`default`);
          }
        } else {
          valueList.push(colValue);
        }
      }
      valuesSqlList.push(valueList);
      if (valueIndex < values.length - 1) {
        valuesSqlList.push(sql`, `);
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict ? sql` on conflict ${onConflict}` : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} values ${valuesSql}${onConflictSql}${returningSql}`;
  }
  buildRefreshMaterializedViewQuery({ view, concurrently, withNoData }) {
    const concurrentlySql = concurrently ? sql` concurrently` : void 0;
    const withNoDataSql = withNoData ? sql` with no data` : void 0;
    return sql`refresh materialized view${concurrentlySql} ${view}${withNoDataSql}`;
  }
  prepareTyping(encoder) {
    if (is(encoder, PgJsonb) || is(encoder, PgJson)) {
      return "json";
    } else if (is(encoder, PgNumeric)) {
      return "decimal";
    } else if (is(encoder, PgTime)) {
      return "time";
    } else if (is(encoder, PgTimestamp)) {
      return "timestamp";
    } else if (is(encoder, PgDate)) {
      return "date";
    } else if (is(encoder, PgUUID)) {
      return "uuid";
    } else {
      return "none";
    }
  }
  sqlToQuery(sql2) {
    return sql2.toQuery({
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      prepareTyping: this.prepareTyping
    });
  }
  // buildRelationalQueryWithPK({
  // 	fullSchema,
  // 	schema,
  // 	tableNamesMap,
  // 	table,
  // 	tableConfig,
  // 	queryConfig: config,
  // 	tableAlias,
  // 	isRoot = false,
  // 	joinOn,
  // }: {
  // 	fullSchema: Record<string, unknown>;
  // 	schema: TablesRelationalConfig;
  // 	tableNamesMap: Record<string, string>;
  // 	table: PgTable;
  // 	tableConfig: TableRelationalConfig;
  // 	queryConfig: true | DBQueryConfig<'many', true>;
  // 	tableAlias: string;
  // 	isRoot?: boolean;
  // 	joinOn?: SQL;
  // }): BuildRelationalQueryResult<PgTable, PgColumn> {
  // 	// For { "<relation>": true }, return a table with selection of all columns
  // 	if (config === true) {
  // 		const selectionEntries = Object.entries(tableConfig.columns);
  // 		const selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = selectionEntries.map((
  // 			[key, value],
  // 		) => ({
  // 			dbKey: value.name,
  // 			tsKey: key,
  // 			field: value as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection,
  // 		};
  // 	}
  // 	// let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// let selectionForBuild = selection;
  // 	const aliasedColumns = Object.fromEntries(
  // 		Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)]),
  // 	);
  // 	const aliasedRelations = Object.fromEntries(
  // 		Object.entries(tableConfig.relations).map(([key, value]) => [key, aliasedRelation(value, tableAlias)]),
  // 	);
  // 	const aliasedFields = Object.assign({}, aliasedColumns, aliasedRelations);
  // 	let where, hasUserDefinedWhere;
  // 	if (config.where) {
  // 		const whereSql = typeof config.where === 'function' ? config.where(aliasedFields, operators) : config.where;
  // 		where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
  // 		hasUserDefinedWhere = !!where;
  // 	}
  // 	where = and(joinOn, where);
  // 	// const fieldsSelection: { tsKey: string; value: PgColumn | SQL.Aliased; isExtra?: boolean }[] = [];
  // 	let joins: Join[] = [];
  // 	let selectedColumns: string[] = [];
  // 	// Figure out which columns to select
  // 	if (config.columns) {
  // 		let isIncludeMode = false;
  // 		for (const [field, value] of Object.entries(config.columns)) {
  // 			if (value === undefined) {
  // 				continue;
  // 			}
  // 			if (field in tableConfig.columns) {
  // 				if (!isIncludeMode && value === true) {
  // 					isIncludeMode = true;
  // 				}
  // 				selectedColumns.push(field);
  // 			}
  // 		}
  // 		if (selectedColumns.length > 0) {
  // 			selectedColumns = isIncludeMode
  // 				? selectedColumns.filter((c) => config.columns?.[c] === true)
  // 				: Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
  // 		}
  // 	} else {
  // 		// Select all columns if selection is not specified
  // 		selectedColumns = Object.keys(tableConfig.columns);
  // 	}
  // 	// for (const field of selectedColumns) {
  // 	// 	const column = tableConfig.columns[field]! as PgColumn;
  // 	// 	fieldsSelection.push({ tsKey: field, value: column });
  // 	// }
  // 	let initiallySelectedRelations: {
  // 		tsKey: string;
  // 		queryConfig: true | DBQueryConfig<'many', false>;
  // 		relation: Relation;
  // 	}[] = [];
  // 	// let selectedRelations: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// Figure out which relations to select
  // 	if (config.with) {
  // 		initiallySelectedRelations = Object.entries(config.with)
  // 			.filter((entry): entry is [typeof entry[0], NonNullable<typeof entry[1]>] => !!entry[1])
  // 			.map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey]! }));
  // 	}
  // 	const manyRelations = initiallySelectedRelations.filter((r) =>
  // 		is(r.relation, Many)
  // 		&& (schema[tableNamesMap[r.relation.referencedTable[Table.Symbol.Name]]!]?.primaryKey.length ?? 0) > 0
  // 	);
  // 	// If this is the last Many relation (or there are no Many relations), we are on the innermost subquery level
  // 	const isInnermostQuery = manyRelations.length < 2;
  // 	const selectedExtras: {
  // 		tsKey: string;
  // 		value: SQL.Aliased;
  // 	}[] = [];
  // 	// Figure out which extras to select
  // 	if (isInnermostQuery && config.extras) {
  // 		const extras = typeof config.extras === 'function'
  // 			? config.extras(aliasedFields, { sql })
  // 			: config.extras;
  // 		for (const [tsKey, value] of Object.entries(extras)) {
  // 			selectedExtras.push({
  // 				tsKey,
  // 				value: mapColumnsInAliasedSQLToAlias(value, tableAlias),
  // 			});
  // 		}
  // 	}
  // 	// Transform `fieldsSelection` into `selection`
  // 	// `fieldsSelection` shouldn't be used after this point
  // 	// for (const { tsKey, value, isExtra } of fieldsSelection) {
  // 	// 	selection.push({
  // 	// 		dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey]!.name,
  // 	// 		tsKey,
  // 	// 		field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
  // 	// 		relationTableTsKey: undefined,
  // 	// 		isJson: false,
  // 	// 		isExtra,
  // 	// 		selection: [],
  // 	// 	});
  // 	// }
  // 	let orderByOrig = typeof config.orderBy === 'function'
  // 		? config.orderBy(aliasedFields, orderByOperators)
  // 		: config.orderBy ?? [];
  // 	if (!Array.isArray(orderByOrig)) {
  // 		orderByOrig = [orderByOrig];
  // 	}
  // 	const orderBy = orderByOrig.map((orderByValue) => {
  // 		if (is(orderByValue, Column)) {
  // 			return aliasedTableColumn(orderByValue, tableAlias) as PgColumn;
  // 		}
  // 		return mapColumnsInSQLToAlias(orderByValue, tableAlias);
  // 	});
  // 	const limit = isInnermostQuery ? config.limit : undefined;
  // 	const offset = isInnermostQuery ? config.offset : undefined;
  // 	// For non-root queries without additional config except columns, return a table with selection
  // 	if (
  // 		!isRoot
  // 		&& initiallySelectedRelations.length === 0
  // 		&& selectedExtras.length === 0
  // 		&& !where
  // 		&& orderBy.length === 0
  // 		&& limit === undefined
  // 		&& offset === undefined
  // 	) {
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection: selectedColumns.map((key) => ({
  // 				dbKey: tableConfig.columns[key]!.name,
  // 				tsKey: key,
  // 				field: tableConfig.columns[key] as PgColumn,
  // 				relationTableTsKey: undefined,
  // 				isJson: false,
  // 				selection: [],
  // 			})),
  // 		};
  // 	}
  // 	const selectedRelationsWithoutPK:
  // 	// Process all relations without primary keys, because they need to be joined differently and will all be on the same query level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of initiallySelectedRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length > 0) {
  // 			continue;
  // 		}
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithoutPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 			nestedQueryRelation: relation,
  // 		});
  // 		const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier('data')}`.as(selectedRelationTsKey);
  // 		joins.push({
  // 			on: sql`true`,
  // 			table: new Subquery(builtRelation.sql as SQL, {}, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: true,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	const oneRelations = initiallySelectedRelations.filter((r): r is typeof r & { relation: One } =>
  // 		is(r.relation, One)
  // 	);
  // 	// Process all One relations with PKs, because they can all be joined on the same level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of oneRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length === 0) {
  // 			continue;
  // 		}
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const field = sql`case when ${sql.identifier(relationTableAlias)} is null then null else json_build_array(${
  // 			sql.join(
  // 				builtRelation.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelation.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: is(builtRelation.sql, SQL)
  // 				? new Subquery(builtRelation.sql, {}, relationTableAlias)
  // 				: aliasedTable(builtRelation.sql, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: is(builtRelation.sql, SQL),
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	let distinct: PgSelectConfig['distinct'];
  // 	let tableFrom: PgTable | Subquery = table;
  // 	// Process first Many relation - each one requires a nested subquery
  // 	const manyRelation = manyRelations[0];
  // 	if (manyRelation) {
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			relation,
  // 		} = manyRelation;
  // 		distinct = {
  // 			on: tableConfig.primaryKey.map((c) => aliasedTableColumn(c as PgColumn, tableAlias)),
  // 		};
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelationJoin = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const builtRelationSelectionField = sql`case when ${
  // 			sql.identifier(relationTableAlias)
  // 		} is null then '[]' else json_agg(json_build_array(${
  // 			sql.join(
  // 				builtRelationJoin.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		})) over (partition by ${sql.join(distinct.on, sql`, `)}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelationJoin.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: isLateralJoin
  // 				? new Subquery(builtRelationJoin.sql as SQL, {}, relationTableAlias)
  // 				: aliasedTable(builtRelationJoin.sql as PgTable, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: isLateralJoin,
  // 		});
  // 		// Build the "from" subquery with the remaining Many relations
  // 		const builtTableFrom = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table,
  // 			tableConfig,
  // 			queryConfig: {
  // 				...config,
  // 				where: undefined,
  // 				orderBy: undefined,
  // 				limit: undefined,
  // 				offset: undefined,
  // 				with: manyRelations.slice(1).reduce<NonNullable<typeof config['with']>>(
  // 					(result, { tsKey, queryConfig: configValue }) => {
  // 						result[tsKey] = configValue;
  // 						return result;
  // 					},
  // 					{},
  // 				),
  // 			},
  // 			tableAlias,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field: builtRelationSelectionField,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelationJoin.selection,
  // 		});
  // 		// selection = builtTableFrom.selection.map((item) =>
  // 		// 	is(item.field, SQL.Aliased)
  // 		// 		? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 		// 		: item
  // 		// );
  // 		// selectionForBuild = [{
  // 		// 	dbKey: '*',
  // 		// 	tsKey: '*',
  // 		// 	field: sql`${sql.identifier(tableAlias)}.*`,
  // 		// 	selection: [],
  // 		// 	isJson: false,
  // 		// 	relationTableTsKey: undefined,
  // 		// }];
  // 		// const newSelectionItem: (typeof selection)[number] = {
  // 		// 	dbKey: selectedRelationTsKey,
  // 		// 	tsKey: selectedRelationTsKey,
  // 		// 	field,
  // 		// 	relationTableTsKey: relationTableTsName,
  // 		// 	isJson: true,
  // 		// 	selection: builtRelationJoin.selection,
  // 		// };
  // 		// selection.push(newSelectionItem);
  // 		// selectionForBuild.push(newSelectionItem);
  // 		tableFrom = is(builtTableFrom.sql, PgTable)
  // 			? builtTableFrom.sql
  // 			: new Subquery(builtTableFrom.sql, {}, tableAlias);
  // 	}
  // 	if (selectedColumns.length === 0 && selectedRelations.length === 0 && selectedExtras.length === 0) {
  // 		throw new DrizzleError(`No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")`);
  // 	}
  // 	let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'];
  // 	function prepareSelectedColumns() {
  // 		return selectedColumns.map((key) => ({
  // 			dbKey: tableConfig.columns[key]!.name,
  // 			tsKey: key,
  // 			field: tableConfig.columns[key] as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	function prepareSelectedExtras() {
  // 		return selectedExtras.map((item) => ({
  // 			dbKey: item.value.fieldAlias,
  // 			tsKey: item.tsKey,
  // 			field: item.value,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	if (isRoot) {
  // 		selection = [
  // 			...prepareSelectedColumns(),
  // 			...prepareSelectedExtras(),
  // 		];
  // 	}
  // 	if (hasUserDefinedWhere || orderBy.length > 0) {
  // 		tableFrom = new Subquery(
  // 			this.buildSelectQuery({
  // 				table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 				fields: {},
  // 				fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 					path: [],
  // 					field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 				})),
  // 				joins,
  // 				distinct,
  // 			}),
  // 			{},
  // 			tableAlias,
  // 		);
  // 		selectionForBuild = selection.map((item) =>
  // 			is(item.field, SQL.Aliased)
  // 				? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 				: item
  // 		);
  // 		joins = [];
  // 		distinct = undefined;
  // 	}
  // 	const result = this.buildSelectQuery({
  // 		table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 		fields: {},
  // 		fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 			path: [],
  // 			field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 		})),
  // 		where,
  // 		limit,
  // 		offset,
  // 		joins,
  // 		orderBy,
  // 		distinct,
  // 	});
  // 	return {
  // 		tableTsKey: tableConfig.tsName,
  // 		sql: result,
  // 		selection,
  // 	};
  // }
  buildRelationalQueryWithoutPK({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = relation.referencedTable[Table.Symbol.Name];
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQueryWithoutPK({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier("data")}`.as(selectedRelationTsKey);
        joins.push({
          on: sql`true`,
          table: new Subquery(builtRelation.sql, {}, relationTableAlias),
          alias: relationTableAlias,
          joinType: "left",
          lateral: true
        });
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({ message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")` });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_build_array(${sql.join(
        selection.map(
          ({ field: field2, tsKey, isJson }) => isJson ? sql`${sql.identifier(`${tableAlias}_${tsKey}`)}.${sql.identifier("data")}` : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_agg(${field}${orderBy.length > 0 ? sql` order by ${sql.join(orderBy, sql`, `)}` : void 0}), '[]'::json)`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [{
            path: [],
            field: sql.raw("*")
          }],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = [];
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, PgTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
}

class TypedQueryBuilder {
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
}

class SelectionProxyHandler {
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === SubqueryConfig) {
      return {
        ...subquery[SubqueryConfig],
        selection: new Proxy(
          subquery[SubqueryConfig].selection,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery[SubqueryConfig].selection : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new SelectionProxyHandler(this.config));
  }
}

class PgSelectBuilder {
  static [entityKind] = "PgSelectBuilder";
  fields;
  session;
  dialect;
  withList = [];
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    if (config.withList) {
      this.withList = config.withList;
    }
    this.distinct = config.distinct;
  }
  /**
   * Specify the table, subquery, or other target that you're
   * building a select query against.
   *
   * {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM | Postgres from documentation}
   */
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source[SubqueryConfig].selection).map((key) => [key, source[key]])
      );
    } else if (is(source, PgViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    return new PgSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    });
  }
}
class PgSelectQueryBuilderBase extends TypedQueryBuilder {
  static [entityKind] = "PgSelectQueryBuilder";
  _;
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table[SubqueryConfig].selection : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getPgSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/pg-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/pg-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/pg-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `intersect all` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets including all duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect-all}
   *
   * @example
   *
   * ```ts
   * // Select all products and quantities that are ordered by both regular and VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered
   * })
   * .from(regularCustomerOrders)
   * .intersectAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { intersectAll } from 'drizzle-orm/pg-core'
   *
   * await intersectAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  intersectAll = this.createSetOperator("intersect", true);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/pg-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /**
   * Adds `except all` set operator to the query.
   *
   * Calling this method will retrieve all rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except-all}
   *
   * @example
   *
   * ```ts
   * // Select all products that are ordered by regular customers but not by VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered,
   * })
   * .from(regularCustomerOrders)
   * .exceptAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered,
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { exceptAll } from 'drizzle-orm/pg-core'
   *
   * await exceptAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  exceptAll = this.createSetOperator("except", true);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /**
   * Adds a `for` clause to the query.
   *
   * Calling this method will specify a lock strength for this query that controls how strictly it acquires exclusive access to the rows being queried.
   *
   * See docs: {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE}
   *
   * @param strength the lock strength.
   * @param config the lock configuration.
   */
  for(strength, config = {}) {
    this.config.lockingClause = { strength, config };
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
}
class PgSelectBase extends PgSelectQueryBuilderBase {
  static [entityKind] = "PgSelect";
  /** @internal */
  _prepare(name) {
    const { session, config, dialect, joinsNotNullableMap } = this;
    if (!session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const fieldsList = orderSelectedFields(config.fields);
      const query = session.prepareQuery(dialect.sqlToQuery(this.getSQL()), fieldsList, name);
      query.joinsNotNullableMap = joinsNotNullableMap;
      return query;
    });
  }
  /**
   * Create a prepared statement for this query. This allows
   * the database to remember this query for the given session
   * and call it by name, rather than specifying the full query.
   *
   * {@link https://www.postgresql.org/docs/current/sql-prepare.html | Postgres prepare documentation}
   */
  prepare(name) {
    return this._prepare(name);
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues);
    });
  };
}
applyMixins(PgSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
const getPgSetOperators = () => ({
  union,
  unionAll,
  intersect,
  intersectAll,
  except,
  exceptAll
});
const union = createSetOperator("union", false);
const unionAll = createSetOperator("union", true);
const intersect = createSetOperator("intersect", false);
const intersectAll = createSetOperator("intersect", true);
const except = createSetOperator("except", false);
const exceptAll = createSetOperator("except", true);

class QueryBuilder {
  static [entityKind] = "PgQueryBuilder";
  dialect;
  $with(alias) {
    const queryBuilder = this;
    return {
      as(qb) {
        if (typeof qb === "function") {
          qb = qb(queryBuilder);
        }
        return new Proxy(
          new WithSubquery(qb.getSQL(), qb.getSelectedFields(), alias, true),
          new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
        );
      }
    };
  }
  with(...queries) {
    const self = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: { on }
      });
    }
    return { select, selectDistinct, selectDistinctOn };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect()
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: { on }
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new PgDialect();
    }
    return this.dialect;
  }
}

class PgRefreshMaterializedView extends QueryPromise {
  constructor(view, session, dialect) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { view };
  }
  static [entityKind] = "PgRefreshMaterializedView";
  config;
  concurrently() {
    if (this.config.withNoData !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.concurrently = true;
    return this;
  }
  withNoData() {
    if (this.config.concurrently !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.withNoData = true;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildRefreshMaterializedViewQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), void 0, name);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues);
    });
  };
}

class PgUpdateBuilder {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "PgUpdateBuilder";
  set(values) {
    return new PgUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    );
  }
}
class PgUpdateBase extends QueryPromise {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList };
  }
  static [entityKind] = "PgUpdate";
  config;
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * await db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * await db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name);
  }
  prepare(name) {
    return this._prepare(name);
  }
  execute = (placeholderValues) => {
    return this._prepare().execute(placeholderValues);
  };
  $dynamic() {
    return this;
  }
}

class RelationalQueryBuilder {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "PgRelationalQueryBuilder";
  findMany(config) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
}
class PgRelationalQuery extends QueryPromise {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entityKind] = "PgRelationalQuery";
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const { query, builtQuery } = this._toSQL();
      return this.session.prepareQuery(
        builtQuery,
        void 0,
        name,
        (rawRows, mapColumnValue) => {
          const rows = rawRows.map(
            (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
          );
          if (this.mode === "first") {
            return rows[0];
          }
          return rows;
        }
      );
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  _getQuery() {
    return this.dialect.buildRelationalQueryWithoutPK({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
  }
  /** @internal */
  getSQL() {
    return this._getQuery().sql;
  }
  _toSQL() {
    const query = this._getQuery();
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  execute() {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute();
    });
  }
}

class PgRaw extends QueryPromise {
  constructor(execute, sql, query, mapBatchResult) {
    super();
    this.execute = execute;
    this.sql = sql;
    this.query = query;
    this.mapBatchResult = mapBatchResult;
  }
  static [entityKind] = "PgRaw";
  /** @internal */
  getSQL() {
    return this.sql;
  }
  getQuery() {
    return this.query;
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
}

class PgDatabase {
  constructor(dialect, session, schema) {
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? { schema: schema.schema, tableNamesMap: schema.tableNamesMap } : { schema: void 0, tableNamesMap: {} };
    this.query = {};
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        this.query[tableName] = new RelationalQueryBuilder(
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
  }
  static [entityKind] = "PgDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with(alias) {
    return {
      as(qb) {
        if (typeof qb === "function") {
          qb = qb(new QueryBuilder());
        }
        return new Proxy(
          new WithSubquery(qb.getSQL(), qb.getSelectedFields(), alias, true),
          new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
        );
      }
    };
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: { on }
      });
    }
    function update(table) {
      return new PgUpdateBuilder(table, self.session, self.dialect, queries);
    }
    function insert(table) {
      return new PgInsertBuilder(table, self.session, self.dialect, queries);
    }
    function delete_(table) {
      return new PgDeleteBase(table, self.session, self.dialect, queries);
    }
    return { select, selectDistinct, selectDistinctOn, update, insert, delete: delete_ };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: { on }
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new PgUpdateBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(table) {
    return new PgInsertBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(table) {
    return new PgDeleteBase(table, this.session, this.dialect);
  }
  refreshMaterializedView(view) {
    return new PgRefreshMaterializedView(view, this.session, this.dialect);
  }
  execute(query) {
    const sql = query.getSQL();
    const builtQuery = this.dialect.sqlToQuery(sql);
    const prepared = this.session.prepareQuery(
      builtQuery,
      void 0,
      void 0
    );
    return new PgRaw(
      () => prepared.execute(),
      sql,
      builtQuery,
      (result) => prepared.mapResult(result, false)
    );
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
}

class IndexBuilderOn {
  constructor(unique, name) {
    this.unique = unique;
    this.name = name;
  }
  static [entityKind] = "PgIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(columns, this.unique, false, this.name);
  }
  onOnly(...columns) {
    return new IndexBuilder(columns, this.unique, true, this.name);
  }
}
class IndexBuilder {
  static [entityKind] = "PgIndexBuilder";
  /** @internal */
  config;
  constructor(columns, unique, only, name) {
    this.config = {
      name,
      columns,
      unique,
      only
    };
  }
  concurrently() {
    this.config.concurrently = true;
    return this;
  }
  using(method) {
    this.config.using = method;
    return this;
  }
  asc() {
    this.config.order = "asc";
    return this;
  }
  desc() {
    this.config.order = "desc";
    return this;
  }
  nullsFirst() {
    this.config.nulls = "first";
    return this;
  }
  nullsLast() {
    this.config.nulls = "last";
    return this;
  }
  where(condition) {
    this.config.where = condition;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
}
class Index {
  static [entityKind] = "PgIndex";
  config;
  constructor(config, table) {
    this.config = { ...config, table };
  }
}
function index(name) {
  return new IndexBuilderOn(false, name);
}

class PgPreparedQuery {
  constructor(query) {
    this.query = query;
  }
  getQuery() {
    return this.query;
  }
  mapResult(response, _isFromBatch) {
    return response;
  }
  static [entityKind] = "PgPreparedQuery";
  /** @internal */
  joinsNotNullableMap;
}
class PgSession {
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "PgSession";
  execute(query) {
    return tracer.startActiveSpan("drizzle.operation", () => {
      const prepared = tracer.startActiveSpan("drizzle.prepareQuery", () => {
        return this.prepareQuery(
          this.dialect.sqlToQuery(query),
          void 0,
          void 0
        );
      });
      return prepared.execute();
    });
  }
  all(query) {
    return this.prepareQuery(
      this.dialect.sqlToQuery(query),
      void 0,
      void 0
    ).all();
  }
}
class PgTransaction extends PgDatabase {
  constructor(dialect, session, schema, nestedIndex = 0) {
    super(dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "PgTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
  /** @internal */
  getTransactionConfigSQL(config) {
    const chunks = [];
    if (config.isolationLevel) {
      chunks.push(`isolation level ${config.isolationLevel}`);
    }
    if (config.accessMode) {
      chunks.push(config.accessMode);
    }
    if (typeof config.deferrable === "boolean") {
      chunks.push(config.deferrable ? "deferrable" : "not deferrable");
    }
    return sql.raw(chunks.join(" "));
  }
  setTransaction(config) {
    return this.session.execute(sql`set transaction ${this.getTransactionConfigSQL(config)}`);
  }
}

class PostgresJsPreparedQuery extends PgPreparedQuery {
  constructor(client, queryString, params, logger, fields, customResultMapper) {
    super({ sql: queryString, params });
    this.client = client;
    this.queryString = queryString;
    this.params = params;
    this.logger = logger;
    this.fields = fields;
    this.customResultMapper = customResultMapper;
  }
  static [entityKind] = "PostgresJsPreparedQuery";
  async execute(placeholderValues = {}) {
    return tracer.startActiveSpan("drizzle.execute", async (span) => {
      const params = fillPlaceholders(this.params, placeholderValues);
      span?.setAttributes({
        "drizzle.query.text": this.queryString,
        "drizzle.query.params": JSON.stringify(params)
      });
      this.logger.logQuery(this.queryString, params);
      const { fields, queryString: query, client, joinsNotNullableMap, customResultMapper } = this;
      if (!fields && !customResultMapper) {
        return tracer.startActiveSpan("drizzle.driver.execute", () => {
          return client.unsafe(query, params);
        });
      }
      const rows = await tracer.startActiveSpan("drizzle.driver.execute", () => {
        span?.setAttributes({
          "drizzle.query.text": query,
          "drizzle.query.params": JSON.stringify(params)
        });
        return client.unsafe(query, params).values();
      });
      return tracer.startActiveSpan("drizzle.mapResponse", () => {
        return customResultMapper ? customResultMapper(rows) : rows.map((row) => mapResultRow(fields, row, joinsNotNullableMap));
      });
    });
  }
  all(placeholderValues = {}) {
    return tracer.startActiveSpan("drizzle.execute", async (span) => {
      const params = fillPlaceholders(this.params, placeholderValues);
      span?.setAttributes({
        "drizzle.query.text": this.queryString,
        "drizzle.query.params": JSON.stringify(params)
      });
      this.logger.logQuery(this.queryString, params);
      return tracer.startActiveSpan("drizzle.driver.execute", () => {
        span?.setAttributes({
          "drizzle.query.text": this.queryString,
          "drizzle.query.params": JSON.stringify(params)
        });
        return this.client.unsafe(this.queryString, params);
      });
    });
  }
}
class PostgresJsSession extends PgSession {
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new NoopLogger();
  }
  static [entityKind] = "PostgresJsSession";
  logger;
  prepareQuery(query, fields, name, customResultMapper) {
    return new PostgresJsPreparedQuery(this.client, query.sql, query.params, this.logger, fields, customResultMapper);
  }
  query(query, params) {
    this.logger.logQuery(query, params);
    return this.client.unsafe(query, params).values();
  }
  queryObjects(query, params) {
    return this.client.unsafe(query, params);
  }
  transaction(transaction, config) {
    return this.client.begin(async (client) => {
      const session = new PostgresJsSession(
        client,
        this.dialect,
        this.schema,
        this.options
      );
      const tx = new PostgresJsTransaction(this.dialect, session, this.schema);
      if (config) {
        await tx.setTransaction(config);
      }
      return transaction(tx);
    });
  }
}
class PostgresJsTransaction extends PgTransaction {
  constructor(dialect, session, schema, nestedIndex = 0) {
    super(dialect, session, schema, nestedIndex);
    this.session = session;
  }
  static [entityKind] = "PostgresJsTransaction";
  transaction(transaction) {
    return this.session.client.savepoint((client) => {
      const session = new PostgresJsSession(client, this.dialect, this.schema, this.session.options);
      const tx = new PostgresJsTransaction(this.dialect, session, this.schema);
      return transaction(tx);
    });
  }
}

function drizzle(client, config = {}) {
  const dialect = new PgDialect();
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new PostgresJsSession(client, dialect, schema, { logger });
  return new PgDatabase(dialect, session, schema);
}

const originCache = new Map()
    , originStackCache = new Map()
    , originError = Symbol('OriginError');

const CLOSE = {};
class Query extends Promise {
  constructor(strings, args, handler, canceller, options = {}) {
    let resolve
      , reject;

    super((a, b) => {
      resolve = a;
      reject = b;
    });

    this.tagged = Array.isArray(strings.raw);
    this.strings = strings;
    this.args = args;
    this.handler = handler;
    this.canceller = canceller;
    this.options = options;

    this.state = null;
    this.statement = null;

    this.resolve = x => (this.active = false, resolve(x));
    this.reject = x => (this.active = false, reject(x));

    this.active = false;
    this.cancelled = null;
    this.executed = false;
    this.signature = '';

    this[originError] = this.handler.debug
      ? new Error()
      : this.tagged && cachedError(this.strings);
  }

  get origin() {
    return (this.handler.debug
      ? this[originError].stack
      : this.tagged && originStackCache.has(this.strings)
        ? originStackCache.get(this.strings)
        : originStackCache.set(this.strings, this[originError].stack).get(this.strings)
    ) || ''
  }

  static get [Symbol.species]() {
    return Promise
  }

  cancel() {
    return this.canceller && (this.canceller(this), this.canceller = null)
  }

  simple() {
    this.options.simple = true;
    this.options.prepare = false;
    return this
  }

  async readable() {
    this.simple();
    this.streaming = true;
    return this
  }

  async writable() {
    this.simple();
    this.streaming = true;
    return this
  }

  cursor(rows = 1, fn) {
    this.options.simple = false;
    if (typeof rows === 'function') {
      fn = rows;
      rows = 1;
    }

    this.cursorRows = rows;

    if (typeof fn === 'function')
      return (this.cursorFn = fn, this)

    let prev;
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => {
          if (this.executed && !this.active)
            return { done: true }

          prev && prev();
          const promise = new Promise((resolve, reject) => {
            this.cursorFn = value => {
              resolve({ value, done: false });
              return new Promise(r => prev = r)
            };
            this.resolve = () => (this.active = false, resolve({ done: true }));
            this.reject = x => (this.active = false, reject(x));
          });
          this.execute();
          return promise
        },
        return() {
          prev && prev(CLOSE);
          return { done: true }
        }
      })
    }
  }

  describe() {
    this.options.simple = false;
    this.onlyDescribe = this.options.prepare = true;
    return this
  }

  stream() {
    throw new Error('.stream has been renamed to .forEach')
  }

  forEach(fn) {
    this.forEachFn = fn;
    this.handle();
    return this
  }

  raw() {
    this.isRaw = true;
    return this
  }

  values() {
    this.isRaw = 'values';
    return this
  }

  async handle() {
    !this.executed && (this.executed = true) && await 1 && this.handler(this);
  }

  execute() {
    this.handle();
    return this
  }

  then() {
    this.handle();
    return super.then.apply(this, arguments)
  }

  catch() {
    this.handle();
    return super.catch.apply(this, arguments)
  }

  finally() {
    this.handle();
    return super.finally.apply(this, arguments)
  }
}

function cachedError(xs) {
  if (originCache.has(xs))
    return originCache.get(xs)

  const x = Error.stackTraceLimit;
  Error.stackTraceLimit = 4;
  originCache.set(xs, new Error());
  Error.stackTraceLimit = x;
  return originCache.get(xs)
}

class PostgresError extends Error {
  constructor(x) {
    super(x.message);
    this.name = this.constructor.name;
    Object.assign(this, x);
  }
}

const Errors = {
  connection,
  postgres,
  generic,
  notSupported
};

function connection(x, options, socket) {
  const { host, port } = socket || options;
  const error = Object.assign(
    new Error(('write ' + x + ' ' + (options.path || (host + ':' + port)))),
    {
      code: x,
      errno: x,
      address: options.path || host
    }, options.path ? {} : { port: port }
  );
  Error.captureStackTrace(error, connection);
  return error
}

function postgres(x) {
  const error = new PostgresError(x);
  Error.captureStackTrace(error, postgres);
  return error
}

function generic(code, message) {
  const error = Object.assign(new Error(code + ': ' + message), { code });
  Error.captureStackTrace(error, generic);
  return error
}

/* c8 ignore next 10 */
function notSupported(x) {
  const error = Object.assign(
    new Error(x + ' (B) is not supported'),
    {
      code: 'MESSAGE_NOT_SUPPORTED',
      name: x
    }
  );
  Error.captureStackTrace(error, notSupported);
  return error
}

const types = {
  string: {
    to: 25,
    from: null,             // defaults to string
    serialize: x => '' + x
  },
  number: {
    to: 0,
    from: [21, 23, 26, 700, 701],
    serialize: x => '' + x,
    parse: x => +x
  },
  json: {
    to: 114,
    from: [114, 3802],
    serialize: x => JSON.stringify(x),
    parse: x => JSON.parse(x)
  },
  boolean: {
    to: 16,
    from: 16,
    serialize: x => x === true ? 't' : 'f',
    parse: x => x === 't'
  },
  date: {
    to: 1184,
    from: [1082, 1114, 1184],
    serialize: x => (x instanceof Date ? x : new Date(x)).toISOString(),
    parse: x => new Date(x)
  },
  bytea: {
    to: 17,
    from: 17,
    serialize: x => '\\x' + Buffer.from(x).toString('hex'),
    parse: x => Buffer.from(x.slice(2), 'hex')
  }
};

class NotTagged { then() { notTagged(); } catch() { notTagged(); } finally() { notTagged(); }}

class Identifier extends NotTagged {
  constructor(value) {
    super();
    this.value = escapeIdentifier(value);
  }
}

class Parameter extends NotTagged {
  constructor(value, type, array) {
    super();
    this.value = value;
    this.type = type;
    this.array = array;
  }
}

class Builder extends NotTagged {
  constructor(first, rest) {
    super();
    this.first = first;
    this.rest = rest;
  }

  build(before, parameters, types, options) {
    const keyword = builders.map(([x, fn]) => ({ fn, i: before.search(x) })).sort((a, b) => a.i - b.i).pop();
    return keyword.i === -1
      ? escapeIdentifiers(this.first, options)
      : keyword.fn(this.first, this.rest, parameters, types, options)
  }
}

function handleValue(x, parameters, types, options) {
  let value = x instanceof Parameter ? x.value : x;
  if (value === undefined) {
    x instanceof Parameter
      ? x.value = options.transform.undefined
      : value = x = options.transform.undefined;

    if (value === undefined)
      throw Errors.generic('UNDEFINED_VALUE', 'Undefined values are not allowed')
  }

  return '$' + (types.push(
    x instanceof Parameter
      ? (parameters.push(x.value), x.array
        ? x.array[x.type || inferType(x.value)] || x.type || firstIsString(x.value)
        : x.type
      )
      : (parameters.push(x), inferType(x))
  ))
}

const defaultHandlers = typeHandlers(types);

function stringify(q, string, value, parameters, types, options) { // eslint-disable-line
  for (let i = 1; i < q.strings.length; i++) {
    string += (stringifyValue(string, value, parameters, types, options)) + q.strings[i];
    value = q.args[i];
  }

  return string
}

function stringifyValue(string, value, parameters, types, o) {
  return (
    value instanceof Builder ? value.build(string, parameters, types, o) :
    value instanceof Query ? fragment(value, parameters, types, o) :
    value instanceof Identifier ? value.value :
    value && value[0] instanceof Query ? value.reduce((acc, x) => acc + ' ' + fragment(x, parameters, types, o), '') :
    handleValue(value, parameters, types, o)
  )
}

function fragment(q, parameters, types, options) {
  q.fragment = true;
  return stringify(q, q.strings[0], q.args[0], parameters, types, options)
}

function valuesBuilder(first, parameters, types, columns, options) {
  return first.map(row =>
    '(' + columns.map(column =>
      stringifyValue('values', row[column], parameters, types, options)
    ).join(',') + ')'
  ).join(',')
}

function values(first, rest, parameters, types, options) {
  const multi = Array.isArray(first[0]);
  const columns = rest.length ? rest.flat() : Object.keys(multi ? first[0] : first);
  return valuesBuilder(multi ? first : [first], parameters, types, columns, options)
}

function select(first, rest, parameters, types, options) {
  typeof first === 'string' && (first = [first].concat(rest));
  if (Array.isArray(first))
    return escapeIdentifiers(first, options)

  let value;
  const columns = rest.length ? rest.flat() : Object.keys(first);
  return columns.map(x => {
    value = first[x];
    return (
      value instanceof Query ? fragment(value, parameters, types, options) :
      value instanceof Identifier ? value.value :
      handleValue(value, parameters, types, options)
    ) + ' as ' + escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x)
  }).join(',')
}

const builders = Object.entries({
  values,
  in: (...xs) => {
    const x = values(...xs);
    return x === '()' ? '(null)' : x
  },
  select,
  as: select,
  returning: select,
  '\\(': select,

  update(first, rest, parameters, types, options) {
    return (rest.length ? rest.flat() : Object.keys(first)).map(x =>
      escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x) +
      '=' + stringifyValue('values', first[x], parameters, types, options)
    )
  },

  insert(first, rest, parameters, types, options) {
    const columns = rest.length ? rest.flat() : Object.keys(Array.isArray(first) ? first[0] : first);
    return '(' + escapeIdentifiers(columns, options) + ')values' +
    valuesBuilder(Array.isArray(first) ? first : [first], parameters, types, columns, options)
  }
}).map(([x, fn]) => ([new RegExp('((?:^|[\\s(])' + x + '(?:$|[\\s(]))(?![\\s\\S]*\\1)', 'i'), fn]));

function notTagged() {
  throw Errors.generic('NOT_TAGGED_CALL', 'Query not called as a tagged template literal')
}

const serializers = defaultHandlers.serializers;
const parsers = defaultHandlers.parsers;

function firstIsString(x) {
  if (Array.isArray(x))
    return firstIsString(x[0])
  return typeof x === 'string' ? 1009 : 0
}

const mergeUserTypes = function(types) {
  const user = typeHandlers(types || {});
  return {
    serializers: Object.assign({}, serializers, user.serializers),
    parsers: Object.assign({}, parsers, user.parsers)
  }
};

function typeHandlers(types) {
  return Object.keys(types).reduce((acc, k) => {
    types[k].from && [].concat(types[k].from).forEach(x => acc.parsers[x] = types[k].parse);
    if (types[k].serialize) {
      acc.serializers[types[k].to] = types[k].serialize;
      types[k].from && [].concat(types[k].from).forEach(x => acc.serializers[x] = types[k].serialize);
    }
    return acc
  }, { parsers: {}, serializers: {} })
}

function escapeIdentifiers(xs, { transform: { column } }) {
  return xs.map(x => escapeIdentifier(column.to ? column.to(x) : x)).join(',')
}

const escapeIdentifier = function escape(str) {
  return '"' + str.replace(/"/g, '""').replace(/\./g, '"."') + '"'
};

const inferType = function inferType(x) {
  return (
    x instanceof Parameter ? x.type :
    x instanceof Date ? 1184 :
    x instanceof Uint8Array ? 17 :
    (x === true || x === false) ? 16 :
    typeof x === 'bigint' ? 20 :
    Array.isArray(x) ? inferType(x[0]) :
    0
  )
};

const escapeBackslash = /\\/g;
const escapeQuote = /"/g;

function arrayEscape(x) {
  return x
    .replace(escapeBackslash, '\\\\')
    .replace(escapeQuote, '\\"')
}

const arraySerializer = function arraySerializer(xs, serializer, options, typarray) {
  if (Array.isArray(xs) === false)
    return xs

  if (!xs.length)
    return '{}'

  const first = xs[0];
  // Only _box (1020) has the ';' delimiter for arrays, all other types use the ',' delimiter
  const delimiter = typarray === 1020 ? ';' : ',';

  if (Array.isArray(first) && !first.type)
    return '{' + xs.map(x => arraySerializer(x, serializer, options, typarray)).join(delimiter) + '}'

  return '{' + xs.map(x => {
    if (x === undefined) {
      x = options.transform.undefined;
      if (x === undefined)
        throw Errors.generic('UNDEFINED_VALUE', 'Undefined values are not allowed')
    }

    return x === null
      ? 'null'
      : '"' + arrayEscape(serializer ? serializer(x.type ? x.value : x) : '' + x) + '"'
  }).join(delimiter) + '}'
};

const arrayParserState = {
  i: 0,
  char: null,
  str: '',
  quoted: false,
  last: 0
};

const arrayParser = function arrayParser(x, parser, typarray) {
  arrayParserState.i = arrayParserState.last = 0;
  return arrayParserLoop(arrayParserState, x, parser, typarray)
};

function arrayParserLoop(s, x, parser, typarray) {
  const xs = [];
  // Only _box (1020) has the ';' delimiter for arrays, all other types use the ',' delimiter
  const delimiter = typarray === 1020 ? ';' : ',';
  for (; s.i < x.length; s.i++) {
    s.char = x[s.i];
    if (s.quoted) {
      if (s.char === '\\') {
        s.str += x[++s.i];
      } else if (s.char === '"') {
        xs.push(parser ? parser(s.str) : s.str);
        s.str = '';
        s.quoted = x[s.i + 1] === '"';
        s.last = s.i + 2;
      } else {
        s.str += s.char;
      }
    } else if (s.char === '"') {
      s.quoted = true;
    } else if (s.char === '{') {
      s.last = ++s.i;
      xs.push(arrayParserLoop(s, x, parser, typarray));
    } else if (s.char === '}') {
      s.quoted = false;
      s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
      break
    } else if (s.char === delimiter && s.p !== '}' && s.p !== '"') {
      xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
    }
    s.p = s.char;
  }
  s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i + 1)) : x.slice(s.last, s.i + 1));
  return xs
}

const toCamel = x => {
  let str = x[0];
  for (let i = 1; i < x.length; i++)
    str += x[i] === '_' ? x[++i].toUpperCase() : x[i];
  return str
};

const toPascal = x => {
  let str = x[0].toUpperCase();
  for (let i = 1; i < x.length; i++)
    str += x[i] === '_' ? x[++i].toUpperCase() : x[i];
  return str
};

const toKebab = x => x.replace(/_/g, '-');

const fromCamel = x => x.replace(/([A-Z])/g, '_$1').toLowerCase();
const fromPascal = x => (x.slice(0, 1) + x.slice(1).replace(/([A-Z])/g, '_$1')).toLowerCase();
const fromKebab = x => x.replace(/-/g, '_');

function createJsonTransform(fn) {
  return function jsonTransform(x, column) {
    return typeof x === 'object' && x !== null && (column.type === 114 || column.type === 3802)
      ? Array.isArray(x)
        ? x.map(x => jsonTransform(x, column))
        : Object.entries(x).reduce((acc, [k, v]) => Object.assign(acc, { [fn(k)]: jsonTransform(v, column) }), {})
      : x
  }
}

toCamel.column = { from: toCamel };
toCamel.value = { from: createJsonTransform(toCamel) };
fromCamel.column = { to: fromCamel };

const camel = { ...toCamel };
camel.column.to = fromCamel;

toPascal.column = { from: toPascal };
toPascal.value = { from: createJsonTransform(toPascal) };
fromPascal.column = { to: fromPascal };

const pascal = { ...toPascal };
pascal.column.to = fromPascal;

toKebab.column = { from: toKebab };
toKebab.value = { from: createJsonTransform(toKebab) };
fromKebab.column = { to: fromKebab };

const kebab = { ...toKebab };
kebab.column.to = fromKebab;

class Result extends Array {
  constructor() {
    super();
    Object.defineProperties(this, {
      count: { value: null, writable: true },
      state: { value: null, writable: true },
      command: { value: null, writable: true },
      columns: { value: null, writable: true },
      statement: { value: null, writable: true }
    });
  }

  static get [Symbol.species]() {
    return Array
  }
}

function Queue(initial = []) {
  let xs = initial.slice();
  let index = 0;

  return {
    get length() {
      return xs.length - index
    },
    remove: (x) => {
      const index = xs.indexOf(x);
      return index === -1
        ? null
        : (xs.splice(index, 1), x)
    },
    push: (x) => (xs.push(x), x),
    shift: () => {
      const out = xs[index++];

      if (index === xs.length) {
        index = 0;
        xs = [];
      } else {
        xs[index - 1] = undefined;
      }

      return out
    }
  }
}

const size = 256;
let buffer = Buffer.allocUnsafe(size);

const messages = 'BCcDdEFfHPpQSX'.split('').reduce((acc, x) => {
  const v = x.charCodeAt(0);
  acc[x] = () => {
    buffer[0] = v;
    b.i = 5;
    return b
  };
  return acc
}, {});

const b = Object.assign(reset, messages, {
  N: String.fromCharCode(0),
  i: 0,
  inc(x) {
    b.i += x;
    return b
  },
  str(x) {
    const length = Buffer.byteLength(x);
    fit(length);
    b.i += buffer.write(x, b.i, length, 'utf8');
    return b
  },
  i16(x) {
    fit(2);
    buffer.writeUInt16BE(x, b.i);
    b.i += 2;
    return b
  },
  i32(x, i) {
    if (i || i === 0) {
      buffer.writeUInt32BE(x, i);
      return b
    }
    fit(4);
    buffer.writeUInt32BE(x, b.i);
    b.i += 4;
    return b
  },
  z(x) {
    fit(x);
    buffer.fill(0, b.i, b.i + x);
    b.i += x;
    return b
  },
  raw(x) {
    buffer = Buffer.concat([buffer.subarray(0, b.i), x]);
    b.i = buffer.length;
    return b
  },
  end(at = 1) {
    buffer.writeUInt32BE(b.i - at, at);
    const out = buffer.subarray(0, b.i);
    b.i = 0;
    buffer = Buffer.allocUnsafe(size);
    return out
  }
});

function fit(x) {
  if (buffer.length - b.i < x) {
    const prev = buffer
        , length = prev.length;

    buffer = Buffer.allocUnsafe(length + (length >> 1) + x);
    prev.copy(buffer);
  }
}

function reset() {
  b.i = 0;
  return b
}

let uid = 1;

const Sync = b().S().end()
    , Flush = b().H().end()
    , SSLRequest = b().i32(8).i32(80877103).end(8)
    , ExecuteUnnamed = Buffer.concat([b().E().str(b.N).i32(0).end(), Sync])
    , DescribeUnnamed = b().D().str('S').str(b.N).end()
    , noop$1 = () => { /* noop */ };

const retryRoutines = new Set([
  'FetchPreparedStatement',
  'RevalidateCachedQuery',
  'transformAssignedExpr'
]);

const errorFields = {
  83  : 'severity_local',    // S
  86  : 'severity',          // V
  67  : 'code',              // C
  77  : 'message',           // M
  68  : 'detail',            // D
  72  : 'hint',              // H
  80  : 'position',          // P
  112 : 'internal_position', // p
  113 : 'internal_query',    // q
  87  : 'where',             // W
  115 : 'schema_name',       // s
  116 : 'table_name',        // t
  99  : 'column_name',       // c
  100 : 'data type_name',    // d
  110 : 'constraint_name',   // n
  70  : 'file',              // F
  76  : 'line',              // L
  82  : 'routine'            // R
};

function Connection(options, queues = {}, { onopen = noop$1, onend = noop$1, onclose = noop$1 } = {}) {
  const {
    ssl,
    max,
    user,
    host,
    port,
    database,
    parsers,
    transform,
    onnotice,
    onnotify,
    onparameter,
    max_pipeline,
    keep_alive,
    backoff,
    target_session_attrs
  } = options;

  const sent = Queue()
      , id = uid++
      , backend = { pid: null, secret: null }
      , idleTimer = timer(end, options.idle_timeout)
      , lifeTimer = timer(end, options.max_lifetime)
      , connectTimer = timer(connectTimedOut, options.connect_timeout);

  let socket = null
    , cancelMessage
    , result = new Result()
    , incoming = Buffer.alloc(0)
    , needsTypes = options.fetch_types
    , backendParameters = {}
    , statements = {}
    , statementId = Math.random().toString(36).slice(2)
    , statementCount = 1
    , closedDate = 0
    , remaining = 0
    , hostIndex = 0
    , retries = 0
    , length = 0
    , delay = 0
    , rows = 0
    , serverSignature = null
    , nextWriteTimer = null
    , terminated = false
    , incomings = null
    , results = null
    , initial = null
    , ending = null
    , stream = null
    , chunk = null
    , ended = null
    , nonce = null
    , query = null
    , final = null;

  const connection = {
    queue: queues.closed,
    idleTimer,
    connect(query) {
      initial = query;
      reconnect();
    },
    terminate,
    execute,
    cancel,
    end,
    count: 0,
    id
  };

  queues.closed && queues.closed.push(connection);

  return connection

  async function createSocket() {
    let x;
    try {
      x = options.socket
        ? (await Promise.resolve(options.socket(options)))
        : new net.Socket();
    } catch (e) {
      error(e);
      return
    }
    x.on('error', error);
    x.on('close', closed);
    x.on('drain', drain);
    return x
  }

  async function cancel({ pid, secret }, resolve, reject) {
    try {
      cancelMessage = b().i32(16).i32(80877102).i32(pid).i32(secret).end(16);
      await connect();
      socket.once('error', reject);
      socket.once('close', resolve);
    } catch (error) {
      reject(error);
    }
  }

  function execute(q) {
    if (terminated)
      return queryError(q, Errors.connection('CONNECTION_DESTROYED', options))

    if (q.cancelled)
      return

    try {
      q.state = backend;
      query
        ? sent.push(q)
        : (query = q, query.active = true);

      build(q);
      return write(toBuffer(q))
        && !q.describeFirst
        && !q.cursorFn
        && sent.length < max_pipeline
        && (!q.options.onexecute || q.options.onexecute(connection))
    } catch (error) {
      sent.length === 0 && write(Sync);
      errored(error);
      return true
    }
  }

  function toBuffer(q) {
    if (q.parameters.length >= 65534)
      throw Errors.generic('MAX_PARAMETERS_EXCEEDED', 'Max number of parameters (65534) exceeded')

    return q.options.simple
      ? b().Q().str(q.statement.string + b.N).end()
      : q.describeFirst
        ? Buffer.concat([describe(q), Flush])
        : q.prepare
          ? q.prepared
            ? prepared(q)
            : Buffer.concat([describe(q), prepared(q)])
          : unnamed(q)
  }

  function describe(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types, q.statement.name),
      Describe('S', q.statement.name)
    ])
  }

  function prepared(q) {
    return Buffer.concat([
      Bind(q.parameters, q.statement.types, q.statement.name, q.cursorName),
      q.cursorFn
        ? Execute('', q.cursorRows)
        : ExecuteUnnamed
    ])
  }

  function unnamed(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types),
      DescribeUnnamed,
      prepared(q)
    ])
  }

  function build(q) {
    const parameters = []
        , types = [];

    const string = stringify(q, q.strings[0], q.args[0], parameters, types, options);

    !q.tagged && q.args.forEach(x => handleValue(x, parameters, types, options));

    q.prepare = options.prepare && ('prepare' in q.options ? q.options.prepare : true);
    q.string = string;
    q.signature = q.prepare && types + string;
    q.onlyDescribe && (delete statements[q.signature]);
    q.parameters = q.parameters || parameters;
    q.prepared = q.prepare && q.signature in statements;
    q.describeFirst = q.onlyDescribe || (parameters.length && !q.prepared);
    q.statement = q.prepared
      ? statements[q.signature]
      : { string, types, name: q.prepare ? statementId + statementCount++ : '' };

    typeof options.debug === 'function' && options.debug(id, string, parameters, types);
  }

  function write(x, fn) {
    chunk = chunk ? Buffer.concat([chunk, x]) : Buffer.from(x);
    if (chunk.length >= 1024)
      return nextWrite(fn)
    nextWriteTimer === null && (nextWriteTimer = setImmediate(nextWrite));
    return true
  }

  function nextWrite(fn) {
    const x = socket.write(chunk, fn);
    nextWriteTimer !== null && clearImmediate(nextWriteTimer);
    chunk = nextWriteTimer = null;
    return x
  }

  function connectTimedOut() {
    errored(Errors.connection('CONNECT_TIMEOUT', options, socket));
    socket.destroy();
  }

  async function secure() {
    write(SSLRequest);
    const canSSL = await new Promise(r => socket.once('data', x => r(x[0] === 83))); // S

    if (!canSSL && ssl === 'prefer')
      return connected()

    socket.removeAllListeners();
    socket = tls.connect({
      socket,
      servername: net.isIP(socket.host) ? undefined : socket.host,
      ...(ssl === 'require' || ssl === 'allow' || ssl === 'prefer'
        ? { rejectUnauthorized: false }
        : ssl === 'verify-full'
          ? {}
          : typeof ssl === 'object'
            ? ssl
            : {}
      )
    });
    socket.on('secureConnect', connected);
    socket.on('error', error);
    socket.on('close', closed);
    socket.on('drain', drain);
  }

  /* c8 ignore next 3 */
  function drain() {
    !query && onopen(connection);
  }

  function data(x) {
    if (incomings) {
      incomings.push(x);
      remaining -= x.length;
      if (remaining > 0)
        return
    }

    incoming = incomings
      ? Buffer.concat(incomings, length - remaining)
      : incoming.length === 0
        ? x
        : Buffer.concat([incoming, x], incoming.length + x.length);

    while (incoming.length > 4) {
      length = incoming.readUInt32BE(1);
      if (length >= incoming.length) {
        remaining = length - incoming.length;
        incomings = [incoming];
        break
      }

      try {
        handle(incoming.subarray(0, length + 1));
      } catch (e) {
        query && (query.cursorFn || query.describeFirst) && write(Sync);
        errored(e);
      }
      incoming = incoming.subarray(length + 1);
      remaining = 0;
      incomings = null;
    }
  }

  async function connect() {
    terminated = false;
    backendParameters = {};
    socket || (socket = await createSocket());

    if (!socket)
      return

    connectTimer.start();

    if (options.socket)
      return ssl ? secure() : connected()

    socket.on('connect', ssl ? secure : connected);

    if (options.path)
      return socket.connect(options.path)

    socket.ssl = ssl;
    socket.connect(port[hostIndex], host[hostIndex]);
    socket.host = host[hostIndex];
    socket.port = port[hostIndex];

    hostIndex = (hostIndex + 1) % port.length;
  }

  function reconnect() {
    setTimeout(connect, closedDate ? closedDate + delay - performance.now() : 0);
  }

  function connected() {
    try {
      statements = {};
      needsTypes = options.fetch_types;
      statementId = Math.random().toString(36).slice(2);
      statementCount = 1;
      lifeTimer.start();
      socket.on('data', data);
      keep_alive && socket.setKeepAlive && socket.setKeepAlive(true, 1000 * keep_alive);
      const s = StartupMessage();
      write(s);
    } catch (err) {
      error(err);
    }
  }

  function error(err) {
    if (connection.queue === queues.connecting && options.host[retries + 1])
      return

    errored(err);
    while (sent.length)
      queryError(sent.shift(), err);
  }

  function errored(err) {
    stream && (stream.destroy(err), stream = null);
    query && queryError(query, err);
    initial && (queryError(initial, err), initial = null);
  }

  function queryError(query, err) {
    if (query.reserve)
      return query.reject(err)

    if (!err || typeof err !== 'object')
      err = new Error(err);

    'query' in err || 'parameters' in err || Object.defineProperties(err, {
      stack: { value: err.stack + query.origin.replace(/.*\n/, '\n'), enumerable: options.debug },
      query: { value: query.string, enumerable: options.debug },
      parameters: { value: query.parameters, enumerable: options.debug },
      args: { value: query.args, enumerable: options.debug },
      types: { value: query.statement && query.statement.types, enumerable: options.debug }
    });
    query.reject(err);
  }

  function end() {
    return ending || (
      !connection.reserved && onend(connection),
      !connection.reserved && !initial && !query && sent.length === 0
        ? (terminate(), new Promise(r => socket && socket.readyState !== 'closed' ? socket.once('close', r) : r()))
        : ending = new Promise(r => ended = r)
    )
  }

  function terminate() {
    terminated = true;
    if (stream || query || initial || sent.length)
      error(Errors.connection('CONNECTION_DESTROYED', options));

    clearImmediate(nextWriteTimer);
    if (socket) {
      socket.removeListener('data', data);
      socket.removeListener('connect', connected);
      socket.readyState === 'open' && socket.end(b().X().end());
    }
    ended && (ended(), ending = ended = null);
  }

  async function closed(hadError) {
    incoming = Buffer.alloc(0);
    remaining = 0;
    incomings = null;
    clearImmediate(nextWriteTimer);
    socket.removeListener('data', data);
    socket.removeListener('connect', connected);
    idleTimer.cancel();
    lifeTimer.cancel();
    connectTimer.cancel();

    socket.removeAllListeners();
    socket = null;

    if (initial)
      return reconnect()

    !hadError && (query || sent.length) && error(Errors.connection('CONNECTION_CLOSED', options, socket));
    closedDate = performance.now();
    hadError && options.shared.retries++;
    delay = (typeof backoff === 'function' ? backoff(options.shared.retries) : backoff) * 1000;
    onclose(connection, Errors.connection('CONNECTION_CLOSED', options, socket));
  }

  /* Handlers */
  function handle(xs, x = xs[0]) {
    (
      x === 68 ? DataRow :                   // D
      x === 100 ? CopyData :                 // d
      x === 65 ? NotificationResponse :      // A
      x === 83 ? ParameterStatus :           // S
      x === 90 ? ReadyForQuery :             // Z
      x === 67 ? CommandComplete :           // C
      x === 50 ? BindComplete :              // 2
      x === 49 ? ParseComplete :             // 1
      x === 116 ? ParameterDescription :     // t
      x === 84 ? RowDescription :            // T
      x === 82 ? Authentication :            // R
      x === 110 ? NoData :                   // n
      x === 75 ? BackendKeyData :            // K
      x === 69 ? ErrorResponse :             // E
      x === 115 ? PortalSuspended :          // s
      x === 51 ? CloseComplete :             // 3
      x === 71 ? CopyInResponse :            // G
      x === 78 ? NoticeResponse :            // N
      x === 72 ? CopyOutResponse :           // H
      x === 99 ? CopyDone :                  // c
      x === 73 ? EmptyQueryResponse :        // I
      x === 86 ? FunctionCallResponse :      // V
      x === 118 ? NegotiateProtocolVersion : // v
      x === 87 ? CopyBothResponse :          // W
      /* c8 ignore next */
      UnknownMessage
    )(xs);
  }

  function DataRow(x) {
    let index = 7;
    let length;
    let column;
    let value;

    const row = query.isRaw ? new Array(query.statement.columns.length) : {};
    for (let i = 0; i < query.statement.columns.length; i++) {
      column = query.statement.columns[i];
      length = x.readInt32BE(index);
      index += 4;

      value = length === -1
        ? null
        : query.isRaw === true
          ? x.subarray(index, index += length)
          : column.parser === undefined
            ? x.toString('utf8', index, index += length)
            : column.parser.array === true
              ? column.parser(x.toString('utf8', index + 1, index += length))
              : column.parser(x.toString('utf8', index, index += length));

      query.isRaw
        ? (row[i] = query.isRaw === true
          ? value
          : transform.value.from ? transform.value.from(value, column) : value)
        : (row[column.name] = transform.value.from ? transform.value.from(value, column) : value);
    }

    query.forEachFn
      ? query.forEachFn(transform.row.from ? transform.row.from(row) : row, result)
      : (result[rows++] = transform.row.from ? transform.row.from(row) : row);
  }

  function ParameterStatus(x) {
    const [k, v] = x.toString('utf8', 5, x.length - 1).split(b.N);
    backendParameters[k] = v;
    if (options.parameters[k] !== v) {
      options.parameters[k] = v;
      onparameter && onparameter(k, v);
    }
  }

  function ReadyForQuery(x) {
    query && query.options.simple && query.resolve(results || result);
    query = results = null;
    result = new Result();
    connectTimer.cancel();

    if (initial) {
      if (target_session_attrs) {
        if (!backendParameters.in_hot_standby || !backendParameters.default_transaction_read_only)
          return fetchState()
        else if (tryNext(target_session_attrs, backendParameters))
          return terminate()
      }

      if (needsTypes) {
        initial.reserve && (initial = null);
        return fetchArrayTypes()
      }

      initial && !initial.reserve && execute(initial);
      options.shared.retries = retries = 0;
      initial = null;
      return
    }

    while (sent.length && (query = sent.shift()) && (query.active = true, query.cancelled))
      Connection(options).cancel(query.state, query.cancelled.resolve, query.cancelled.reject);

    if (query)
      return // Consider opening if able and sent.length < 50

    connection.reserved
      ? !connection.reserved.release && x[5] === 73 // I
        ? ending
          ? terminate()
          : (connection.reserved = null, onopen(connection))
        : connection.reserved()
      : ending
        ? terminate()
        : onopen(connection);
  }

  function CommandComplete(x) {
    rows = 0;

    for (let i = x.length - 1; i > 0; i--) {
      if (x[i] === 32 && x[i + 1] < 58 && result.count === null)
        result.count = +x.toString('utf8', i + 1, x.length - 1);
      if (x[i - 1] >= 65) {
        result.command = x.toString('utf8', 5, i);
        result.state = backend;
        break
      }
    }

    final && (final(), final = null);

    if (result.command === 'BEGIN' && max !== 1 && !connection.reserved)
      return errored(Errors.generic('UNSAFE_TRANSACTION', 'Only use sql.begin, sql.reserved or max: 1'))

    if (query.options.simple)
      return BindComplete()

    if (query.cursorFn) {
      result.count && query.cursorFn(result);
      write(Sync);
    }

    query.resolve(result);
  }

  function ParseComplete() {
    query.parsing = false;
  }

  function BindComplete() {
    !result.statement && (result.statement = query.statement);
    result.columns = query.statement.columns;
  }

  function ParameterDescription(x) {
    const length = x.readUInt16BE(5);

    for (let i = 0; i < length; ++i)
      !query.statement.types[i] && (query.statement.types[i] = x.readUInt32BE(7 + i * 4));

    query.prepare && (statements[query.signature] = query.statement);
    query.describeFirst && !query.onlyDescribe && (write(prepared(query)), query.describeFirst = false);
  }

  function RowDescription(x) {
    if (result.command) {
      results = results || [result];
      results.push(result = new Result());
      result.count = null;
      query.statement.columns = null;
    }

    const length = x.readUInt16BE(5);
    let index = 7;
    let start;

    query.statement.columns = Array(length);

    for (let i = 0; i < length; ++i) {
      start = index;
      while (x[index++] !== 0);
      const table = x.readUInt32BE(index);
      const number = x.readUInt16BE(index + 4);
      const type = x.readUInt32BE(index + 6);
      query.statement.columns[i] = {
        name: transform.column.from
          ? transform.column.from(x.toString('utf8', start, index - 1))
          : x.toString('utf8', start, index - 1),
        parser: parsers[type],
        table,
        number,
        type
      };
      index += 18;
    }

    result.statement = query.statement;
    if (query.onlyDescribe)
      return (query.resolve(query.statement), write(Sync))
  }

  async function Authentication(x, type = x.readUInt32BE(5)) {
    (
      type === 3 ? AuthenticationCleartextPassword :
      type === 5 ? AuthenticationMD5Password :
      type === 10 ? SASL :
      type === 11 ? SASLContinue :
      type === 12 ? SASLFinal :
      type !== 0 ? UnknownAuth :
      noop$1
    )(x, type);
  }

  /* c8 ignore next 5 */
  async function AuthenticationCleartextPassword() {
    const payload = await Pass();
    write(
      b().p().str(payload).z(1).end()
    );
  }

  async function AuthenticationMD5Password(x) {
    const payload = 'md5' + (
      await md5(
        Buffer.concat([
          Buffer.from(await md5((await Pass()) + user)),
          x.subarray(9)
        ])
      )
    );
    write(
      b().p().str(payload).z(1).end()
    );
  }

  async function SASL() {
    nonce = (await crypto.randomBytes(18)).toString('base64');
    b().p().str('SCRAM-SHA-256' + b.N);
    const i = b.i;
    write(b.inc(4).str('n,,n=*,r=' + nonce).i32(b.i - i - 4, i).end());
  }

  async function SASLContinue(x) {
    const res = x.toString('utf8', 9).split(',').reduce((acc, x) => (acc[x[0]] = x.slice(2), acc), {});

    const saltedPassword = await crypto.pbkdf2Sync(
      await Pass(),
      Buffer.from(res.s, 'base64'),
      parseInt(res.i), 32,
      'sha256'
    );

    const clientKey = await hmac(saltedPassword, 'Client Key');

    const auth = 'n=*,r=' + nonce + ','
               + 'r=' + res.r + ',s=' + res.s + ',i=' + res.i
               + ',c=biws,r=' + res.r;

    serverSignature = (await hmac(await hmac(saltedPassword, 'Server Key'), auth)).toString('base64');

    const payload = 'c=biws,r=' + res.r + ',p=' + xor(
      clientKey, Buffer.from(await hmac(await sha256(clientKey), auth))
    ).toString('base64');

    write(
      b().p().str(payload).end()
    );
  }

  function SASLFinal(x) {
    if (x.toString('utf8', 9).split(b.N, 1)[0].slice(2) === serverSignature)
      return
    /* c8 ignore next 5 */
    errored(Errors.generic('SASL_SIGNATURE_MISMATCH', 'The server did not return the correct signature'));
    socket.destroy();
  }

  function Pass() {
    return Promise.resolve(typeof options.pass === 'function'
      ? options.pass()
      : options.pass
    )
  }

  function NoData() {
    result.statement = query.statement;
    result.statement.columns = [];
    if (query.onlyDescribe)
      return (query.resolve(query.statement), write(Sync))
  }

  function BackendKeyData(x) {
    backend.pid = x.readUInt32BE(5);
    backend.secret = x.readUInt32BE(9);
  }

  async function fetchArrayTypes() {
    needsTypes = false;
    const types = await new Query([`
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b on b.oid = a.typelem
      where a.typcategory = 'A'
      group by b.oid, b.typarray
      order by b.oid
    `], [], execute);
    types.forEach(({ oid, typarray }) => addArrayType(oid, typarray));
  }

  function addArrayType(oid, typarray) {
    if (!!options.parsers[typarray] && !!options.serializers[typarray]) return
    const parser = options.parsers[oid];
    options.shared.typeArrayMap[oid] = typarray;
    options.parsers[typarray] = (xs) => arrayParser(xs, parser, typarray);
    options.parsers[typarray].array = true;
    options.serializers[typarray] = (xs) => arraySerializer(xs, options.serializers[oid], options, typarray);
  }

  function tryNext(x, xs) {
    return (
      (x === 'read-write' && xs.default_transaction_read_only === 'on') ||
      (x === 'read-only' && xs.default_transaction_read_only === 'off') ||
      (x === 'primary' && xs.in_hot_standby === 'on') ||
      (x === 'standby' && xs.in_hot_standby === 'off') ||
      (x === 'prefer-standby' && xs.in_hot_standby === 'off' && options.host[retries])
    )
  }

  function fetchState() {
    const query = new Query([`
      show transaction_read_only;
      select pg_catalog.pg_is_in_recovery()
    `], [], execute, null, { simple: true });
    query.resolve = ([[a], [b]]) => {
      backendParameters.default_transaction_read_only = a.transaction_read_only;
      backendParameters.in_hot_standby = b.pg_is_in_recovery ? 'on' : 'off';
    };
    query.execute();
  }

  function ErrorResponse(x) {
    query && (query.cursorFn || query.describeFirst) && write(Sync);
    const error = Errors.postgres(parseError(x));
    query && query.retried
      ? errored(query.retried)
      : query && query.prepared && retryRoutines.has(error.routine)
        ? retry(query, error)
        : errored(error);
  }

  function retry(q, error) {
    delete statements[q.signature];
    q.retried = error;
    execute(q);
  }

  function NotificationResponse(x) {
    if (!onnotify)
      return

    let index = 9;
    while (x[index++] !== 0);
    onnotify(
      x.toString('utf8', 9, index - 1),
      x.toString('utf8', index, x.length - 1)
    );
  }

  async function PortalSuspended() {
    try {
      const x = await Promise.resolve(query.cursorFn(result));
      rows = 0;
      x === CLOSE
        ? write(Close(query.portal))
        : (result = new Result(), write(Execute('', query.cursorRows)));
    } catch (err) {
      write(Sync);
      query.reject(err);
    }
  }

  function CloseComplete() {
    result.count && query.cursorFn(result);
    query.resolve(result);
  }

  function CopyInResponse() {
    stream = new Stream.Writable({
      autoDestroy: true,
      write(chunk, encoding, callback) {
        socket.write(b().d().raw(chunk).end(), callback);
      },
      destroy(error, callback) {
        callback(error);
        socket.write(b().f().str(error + b.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(b().c().end());
        final = callback;
      }
    });
    query.resolve(stream);
  }

  function CopyOutResponse() {
    stream = new Stream.Readable({
      read() { socket.resume(); }
    });
    query.resolve(stream);
  }

  /* c8 ignore next 3 */
  function CopyBothResponse() {
    stream = new Stream.Duplex({
      autoDestroy: true,
      read() { socket.resume(); },
      /* c8 ignore next 11 */
      write(chunk, encoding, callback) {
        socket.write(b().d().raw(chunk).end(), callback);
      },
      destroy(error, callback) {
        callback(error);
        socket.write(b().f().str(error + b.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(b().c().end());
        final = callback;
      }
    });
    query.resolve(stream);
  }

  function CopyData(x) {
    stream && (stream.push(x.subarray(5)) || socket.pause());
  }

  function CopyDone() {
    stream && stream.push(null);
    stream = null;
  }

  function NoticeResponse(x) {
    onnotice
      ? onnotice(parseError(x))
      : console.log(parseError(x)); // eslint-disable-line

  }

  /* c8 ignore next 3 */
  function EmptyQueryResponse() {
    /* noop */
  }

  /* c8 ignore next 3 */
  function FunctionCallResponse() {
    errored(Errors.notSupported('FunctionCallResponse'));
  }

  /* c8 ignore next 3 */
  function NegotiateProtocolVersion() {
    errored(Errors.notSupported('NegotiateProtocolVersion'));
  }

  /* c8 ignore next 3 */
  function UnknownMessage(x) {
    console.error('Postgres.js : Unknown Message:', x[0]); // eslint-disable-line
  }

  /* c8 ignore next 3 */
  function UnknownAuth(x, type) {
    console.error('Postgres.js : Unknown Auth:', type); // eslint-disable-line
  }

  /* Messages */
  function Bind(parameters, types, statement = '', portal = '') {
    let prev
      , type;

    b().B().str(portal + b.N).str(statement + b.N).i16(0).i16(parameters.length);

    parameters.forEach((x, i) => {
      if (x === null)
        return b.i32(0xFFFFFFFF)

      type = types[i];
      parameters[i] = x = type in options.serializers
        ? options.serializers[type](x)
        : '' + x;

      prev = b.i;
      b.inc(4).str(x).i32(b.i - prev - 4, prev);
    });

    b.i16(0);

    return b.end()
  }

  function Parse(str, parameters, types, name = '') {
    b().P().str(name + b.N).str(str + b.N).i16(parameters.length);
    parameters.forEach((x, i) => b.i32(types[i] || 0));
    return b.end()
  }

  function Describe(x, name = '') {
    return b().D().str(x).str(name + b.N).end()
  }

  function Execute(portal = '', rows = 0) {
    return Buffer.concat([
      b().E().str(portal + b.N).i32(rows).end(),
      Flush
    ])
  }

  function Close(portal = '') {
    return Buffer.concat([
      b().C().str('P').str(portal + b.N).end(),
      b().S().end()
    ])
  }

  function StartupMessage() {
    return cancelMessage || b().inc(4).i16(3).z(2).str(
      Object.entries(Object.assign({
        user,
        database,
        client_encoding: 'UTF8'
      },
        options.connection
      )).filter(([, v]) => v).map(([k, v]) => k + b.N + v).join(b.N)
    ).z(2).end(0)
  }

}

function parseError(x) {
  const error = {};
  let start = 5;
  for (let i = 5; i < x.length - 1; i++) {
    if (x[i] === 0) {
      error[errorFields[x[start]]] = x.toString('utf8', start + 1, i);
      start = i + 1;
    }
  }
  return error
}

function md5(x) {
  return crypto.createHash('md5').update(x).digest('hex')
}

function hmac(key, x) {
  return crypto.createHmac('sha256', key).update(x).digest()
}

function sha256(x) {
  return crypto.createHash('sha256').update(x).digest()
}

function xor(a, b) {
  const length = Math.max(a.length, b.length);
  const buffer = Buffer.allocUnsafe(length);
  for (let i = 0; i < length; i++)
    buffer[i] = a[i] ^ b[i];
  return buffer
}

function timer(fn, seconds) {
  seconds = typeof seconds === 'function' ? seconds() : seconds;
  if (!seconds)
    return { cancel: noop$1, start: noop$1 }

  let timer;
  return {
    cancel() {
      timer && (clearTimeout(timer), timer = null);
    },
    start() {
      timer && clearTimeout(timer);
      timer = setTimeout(done, seconds * 1000, arguments);
    }
  }

  function done(args) {
    fn.apply(null, args);
    timer = null;
  }
}

const noop = () => { /* noop */ };

function Subscribe(postgres, options) {
  const subscribers = new Map()
      , slot = 'postgresjs_' + Math.random().toString(36).slice(2)
      , state = {};

  let connection
    , stream
    , ended = false;

  const sql = subscribe.sql = postgres({
    ...options,
    transform: { column: {}, value: {}, row: {} },
    max: 1,
    fetch_types: false,
    idle_timeout: null,
    max_lifetime: null,
    connection: {
      ...options.connection,
      replication: 'database'
    },
    onclose: async function() {
      if (ended)
        return
      stream = null;
      state.pid = state.secret = undefined;
      connected(await init(sql, slot, options.publications));
      subscribers.forEach(event => event.forEach(({ onsubscribe }) => onsubscribe()));
    },
    no_subscribe: true
  });

  const end = sql.end
      , close = sql.close;

  sql.end = async() => {
    ended = true;
    stream && (await new Promise(r => (stream.once('close', r), stream.end())));
    return end()
  };

  sql.close = async() => {
    stream && (await new Promise(r => (stream.once('close', r), stream.end())));
    return close()
  };

  return subscribe

  async function subscribe(event, fn, onsubscribe = noop, onerror = noop) {
    event = parseEvent(event);

    if (!connection)
      connection = init(sql, slot, options.publications);

    const subscriber = { fn, onsubscribe };
    const fns = subscribers.has(event)
      ? subscribers.get(event).add(subscriber)
      : subscribers.set(event, new Set([subscriber])).get(event);

    const unsubscribe = () => {
      fns.delete(subscriber);
      fns.size === 0 && subscribers.delete(event);
    };

    return connection.then(x => {
      connected(x);
      onsubscribe();
      stream && stream.on('error', onerror);
      return { unsubscribe, state, sql }
    })
  }

  function connected(x) {
    stream = x.stream;
    state.pid = x.state.pid;
    state.secret = x.state.secret;
  }

  async function init(sql, slot, publications) {
    if (!publications)
      throw new Error('Missing publication names')

    const xs = await sql.unsafe(
      `CREATE_REPLICATION_SLOT ${ slot } TEMPORARY LOGICAL pgoutput NOEXPORT_SNAPSHOT`
    );

    const [x] = xs;

    const stream = await sql.unsafe(
      `START_REPLICATION SLOT ${ slot } LOGICAL ${
        x.consistent_point
      } (proto_version '1', publication_names '${ publications }')`
    ).writable();

    const state = {
      lsn: Buffer.concat(x.consistent_point.split('/').map(x => Buffer.from(('00000000' + x).slice(-8), 'hex')))
    };

    stream.on('data', data);
    stream.on('error', error);
    stream.on('close', sql.close);

    return { stream, state: xs.state }

    function error(e) {
      console.error('Unexpected error during logical streaming - reconnecting', e); // eslint-disable-line
    }

    function data(x) {
      if (x[0] === 0x77) {
        parse(x.subarray(25), state, sql.options.parsers, handle, options.transform);
      } else if (x[0] === 0x6b && x[17]) {
        state.lsn = x.subarray(1, 9);
        pong();
      }
    }

    function handle(a, b) {
      const path = b.relation.schema + '.' + b.relation.table;
      call('*', a, b);
      call('*:' + path, a, b);
      b.relation.keys.length && call('*:' + path + '=' + b.relation.keys.map(x => a[x.name]), a, b);
      call(b.command, a, b);
      call(b.command + ':' + path, a, b);
      b.relation.keys.length && call(b.command + ':' + path + '=' + b.relation.keys.map(x => a[x.name]), a, b);
    }

    function pong() {
      const x = Buffer.alloc(34);
      x[0] = 'r'.charCodeAt(0);
      x.fill(state.lsn, 1);
      x.writeBigInt64BE(BigInt(Date.now() - Date.UTC(2000, 0, 1)) * BigInt(1000), 25);
      stream.write(x);
    }
  }

  function call(x, a, b) {
    subscribers.has(x) && subscribers.get(x).forEach(({ fn }) => fn(a, b, x));
  }
}

function Time(x) {
  return new Date(Date.UTC(2000, 0, 1) + Number(x / BigInt(1000)))
}

function parse(x, state, parsers, handle, transform) {
  const char = (acc, [k, v]) => (acc[k.charCodeAt(0)] = v, acc);

  Object.entries({
    R: x => {  // Relation
      let i = 1;
      const r = state[x.readUInt32BE(i)] = {
        schema: x.toString('utf8', i += 4, i = x.indexOf(0, i)) || 'pg_catalog',
        table: x.toString('utf8', i + 1, i = x.indexOf(0, i + 1)),
        columns: Array(x.readUInt16BE(i += 2)),
        keys: []
      };
      i += 2;

      let columnIndex = 0
        , column;

      while (i < x.length) {
        column = r.columns[columnIndex++] = {
          key: x[i++],
          name: transform.column.from
            ? transform.column.from(x.toString('utf8', i, i = x.indexOf(0, i)))
            : x.toString('utf8', i, i = x.indexOf(0, i)),
          type: x.readUInt32BE(i += 1),
          parser: parsers[x.readUInt32BE(i)],
          atttypmod: x.readUInt32BE(i += 4)
        };

        column.key && r.keys.push(column);
        i += 4;
      }
    },
    Y: () => { /* noop */ }, // Type
    O: () => { /* noop */ }, // Origin
    B: x => { // Begin
      state.date = Time(x.readBigInt64BE(9));
      state.lsn = x.subarray(1, 9);
    },
    I: x => { // Insert
      let i = 1;
      const relation = state[x.readUInt32BE(i)];
      const { row } = tuples(x, relation.columns, i += 7, transform);

      handle(row, {
        command: 'insert',
        relation
      });
    },
    D: x => { // Delete
      let i = 1;
      const relation = state[x.readUInt32BE(i)];
      i += 4;
      const key = x[i] === 75;
      handle(key || x[i] === 79
        ? tuples(x, relation.columns, i += 3, transform).row
        : null
      , {
        command: 'delete',
        relation,
        key
      });
    },
    U: x => { // Update
      let i = 1;
      const relation = state[x.readUInt32BE(i)];
      i += 4;
      const key = x[i] === 75;
      const xs = key || x[i] === 79
        ? tuples(x, relation.columns, i += 3, transform)
        : null;

      xs && (i = xs.i);

      const { row } = tuples(x, relation.columns, i + 3, transform);

      handle(row, {
        command: 'update',
        relation,
        key,
        old: xs && xs.row
      });
    },
    T: () => { /* noop */ }, // Truncate,
    C: () => { /* noop */ }  // Commit
  }).reduce(char, {})[x[0]](x);
}

function tuples(x, columns, xi, transform) {
  let type
    , column
    , value;

  const row = transform.raw ? new Array(columns.length) : {};
  for (let i = 0; i < columns.length; i++) {
    type = x[xi++];
    column = columns[i];
    value = type === 110 // n
      ? null
      : type === 117 // u
        ? undefined
        : column.parser === undefined
          ? x.toString('utf8', xi + 4, xi += 4 + x.readUInt32BE(xi))
          : column.parser.array === true
            ? column.parser(x.toString('utf8', xi + 5, xi += 4 + x.readUInt32BE(xi)))
            : column.parser(x.toString('utf8', xi + 4, xi += 4 + x.readUInt32BE(xi)));

    transform.raw
      ? (row[i] = transform.raw === true
        ? value
        : transform.value.from ? transform.value.from(value, column) : value)
      : (row[column.name] = transform.value.from
        ? transform.value.from(value, column)
        : value
      );
  }

  return { i: xi, row: transform.row.from ? transform.row.from(row) : row }
}

function parseEvent(x) {
  const xs = x.match(/^(\*|insert|update|delete)?:?([^.]+?\.?[^=]+)?=?(.+)?/i) || [];

  if (!xs)
    throw new Error('Malformed subscribe pattern: ' + x)

  const [, command, path, key] = xs;

  return (command || '*')
       + (path ? ':' + (path.indexOf('.') === -1 ? 'public.' + path : path) : '')
       + (key ? '=' + key : '')
}

function largeObject(sql, oid, mode = 0x00020000 | 0x00040000) {
  return new Promise(async(resolve, reject) => {
    await sql.begin(async sql => {
      let finish;
      !oid && ([{ oid }] = await sql`select lo_creat(-1) as oid`);
      const [{ fd }] = await sql`select lo_open(${ oid }, ${ mode }) as fd`;

      const lo = {
        writable,
        readable,
        close     : () => sql`select lo_close(${ fd })`.then(finish),
        tell      : () => sql`select lo_tell64(${ fd })`,
        read      : (x) => sql`select loread(${ fd }, ${ x }) as data`,
        write     : (x) => sql`select lowrite(${ fd }, ${ x })`,
        truncate  : (x) => sql`select lo_truncate64(${ fd }, ${ x })`,
        seek      : (x, whence = 0) => sql`select lo_lseek64(${ fd }, ${ x }, ${ whence })`,
        size      : () => sql`
          select
            lo_lseek64(${ fd }, location, 0) as position,
            seek.size
          from (
            select
              lo_lseek64($1, 0, 2) as size,
              tell.location
            from (select lo_tell64($1) as location) tell
          ) seek
        `
      };

      resolve(lo);

      return new Promise(async r => finish = r)

      async function readable({
        highWaterMark = 2048 * 8,
        start = 0,
        end = Infinity
      } = {}) {
        let max = end - start;
        start && await lo.seek(start);
        return new Stream.Readable({
          highWaterMark,
          async read(size) {
            const l = size > max ? size - max : size;
            max -= size;
            const [{ data }] = await lo.read(l);
            this.push(data);
            if (data.length < size)
              this.push(null);
          }
        })
      }

      async function writable({
        highWaterMark = 2048 * 8,
        start = 0
      } = {}) {
        start && await lo.seek(start);
        return new Stream.Writable({
          highWaterMark,
          write(chunk, encoding, callback) {
            lo.write(chunk).then(() => callback(), callback);
          }
        })
      }
    }).catch(reject);
  })
}

Object.assign(Postgres, {
  PostgresError,
  toPascal,
  pascal,
  toCamel,
  camel,
  toKebab,
  kebab,
  fromPascal,
  fromCamel,
  fromKebab,
  BigInt: {
    to: 20,
    from: [20],
    parse: x => BigInt(x), // eslint-disable-line
    serialize: x => x.toString()
  }
});

function Postgres(a, b) {
  const options = parseOptions(a, b)
      , subscribe = options.no_subscribe || Subscribe(Postgres, { ...options });

  let ending = false;

  const queries = Queue()
      , connecting = Queue()
      , reserved = Queue()
      , closed = Queue()
      , ended = Queue()
      , open = Queue()
      , busy = Queue()
      , full = Queue()
      , queues = { connecting, closed};

  const connections = [...Array(options.max)].map(() => Connection(options, queues, { onopen, onend, onclose }));

  const sql = Sql(handler);

  Object.assign(sql, {
    get parameters() { return options.parameters },
    largeObject: largeObject.bind(null, sql),
    subscribe,
    CLOSE,
    END: CLOSE,
    PostgresError,
    options,
    reserve,
    listen,
    begin,
    close,
    end
  });

  return sql

  function Sql(handler) {
    handler.debug = options.debug;

    Object.entries(options.types).reduce((acc, [name, type]) => {
      acc[name] = (x) => new Parameter(x, type.to);
      return acc
    }, typed);

    Object.assign(sql, {
      types: typed,
      typed,
      unsafe,
      notify,
      array,
      json,
      file
    });

    return sql

    function typed(value, type) {
      return new Parameter(value, type)
    }

    function sql(strings, ...args) {
      const query = strings && Array.isArray(strings.raw)
        ? new Query(strings, args, handler, cancel)
        : typeof strings === 'string' && !args.length
          ? new Identifier(options.transform.column.to ? options.transform.column.to(strings) : strings)
          : new Builder(strings, args);
      return query
    }

    function unsafe(string, args = [], options = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options = args, args = []);
      const query = new Query([string], args, handler, cancel, {
        prepare: false,
        ...options,
        simple: 'simple' in options ? options.simple : args.length === 0
      });
      return query
    }

    function file(path, args = [], options = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options = args, args = []);
      const query = new Query([], args, (query) => {
        fs.readFile(path, 'utf8', (err, string) => {
          if (err)
            return query.reject(err)

          query.strings = [string];
          handler(query);
        });
      }, cancel, {
        ...options,
        simple: 'simple' in options ? options.simple : args.length === 0
      });
      return query
    }
  }

  async function listen(name, fn, onlisten) {
    const listener = { fn, onlisten };

    const sql = listen.sql || (listen.sql = Postgres({
      ...options,
      max: 1,
      idle_timeout: null,
      max_lifetime: null,
      fetch_types: false,
      onclose() {
        Object.entries(listen.channels).forEach(([name, { listeners }]) => {
          delete listen.channels[name];
          Promise.all(listeners.map(l => listen(name, l.fn, l.onlisten).catch(() => { /* noop */ })));
        });
      },
      onnotify(c, x) {
        c in listen.channels && listen.channels[c].listeners.forEach(l => l.fn(x));
      }
    }));

    const channels = listen.channels || (listen.channels = {})
        , exists = name in channels;

    if (exists) {
      channels[name].listeners.push(listener);
      const result = await channels[name].result;
      listener.onlisten && listener.onlisten();
      return { state: result.state, unlisten }
    }

    channels[name] = { result: sql`listen ${
      sql.unsafe('"' + name.replace(/"/g, '""') + '"')
    }`, listeners: [listener] };
    const result = await channels[name].result;
    listener.onlisten && listener.onlisten();
    return { state: result.state, unlisten }

    async function unlisten() {
      if (name in channels === false)
        return

      channels[name].listeners = channels[name].listeners.filter(x => x !== listener);
      if (channels[name].listeners.length)
        return

      delete channels[name];
      return sql`unlisten ${
        sql.unsafe('"' + name.replace(/"/g, '""') + '"')
      }`
    }
  }

  async function notify(channel, payload) {
    return await sql`select pg_notify(${ channel }, ${ '' + payload })`
  }

  async function reserve() {
    const queue = Queue();
    const c = open.length
      ? open.shift()
      : await new Promise((resolve, reject) => {
        const query = { reserve: resolve, reject };
        queries.push(query);
        closed.length && connect(closed.shift(), query);
      });

    move(c, reserved);
    c.reserved = () => queue.length
      ? c.execute(queue.shift())
      : move(c, reserved);
    c.reserved.release = true;

    const sql = Sql(handler);
    sql.release = () => {
      c.reserved = null;
      onopen(c);
    };

    return sql

    function handler(q) {
      c.queue === full
        ? queue.push(q)
        : c.execute(q) || move(c, full);
    }
  }

  async function begin(options, fn) {
    !fn && (fn = options, options = '');
    const queries = Queue();
    let savepoints = 0
      , connection
      , prepare = null;

    try {
      await sql.unsafe('begin ' + options.replace(/[^a-z ]/ig, ''), [], { onexecute }).execute();
      return await Promise.race([
        scope(connection, fn),
        new Promise((_, reject) => connection.onclose = reject)
      ])
    } catch (error) {
      throw error
    }

    async function scope(c, fn, name) {
      const sql = Sql(handler);
      sql.savepoint = savepoint;
      sql.prepare = x => prepare = x.replace(/[^a-z0-9$-_. ]/gi);
      let uncaughtError
        , result;

      name && await sql`savepoint ${ sql(name) }`;
      try {
        result = await new Promise((resolve, reject) => {
          const x = fn(sql);
          Promise.resolve(Array.isArray(x) ? Promise.all(x) : x).then(resolve, reject);
        });

        if (uncaughtError)
          throw uncaughtError
      } catch (e) {
        await (name
          ? sql`rollback to ${ sql(name) }`
          : sql`rollback`
        );
        throw e instanceof PostgresError && e.code === '25P02' && uncaughtError || e
      }

      if (!name) {
        prepare
          ? await sql`prepare transaction '${ sql.unsafe(prepare) }'`
          : await sql`commit`;
      }

      return result

      function savepoint(name, fn) {
        if (name && Array.isArray(name.raw))
          return savepoint(sql => sql.apply(sql, arguments))

        arguments.length === 1 && (fn = name, name = null);
        return scope(c, fn, 's' + savepoints++ + (name ? '_' + name : ''))
      }

      function handler(q) {
        q.catch(e => uncaughtError || (uncaughtError = e));
        c.queue === full
          ? queries.push(q)
          : c.execute(q) || move(c, full);
      }
    }

    function onexecute(c) {
      connection = c;
      move(c, reserved);
      c.reserved = () => queries.length
        ? c.execute(queries.shift())
        : move(c, reserved);
    }
  }

  function move(c, queue) {
    c.queue.remove(c);
    queue.push(c);
    c.queue = queue;
    queue === open
      ? c.idleTimer.start()
      : c.idleTimer.cancel();
    return c
  }

  function json(x) {
    return new Parameter(x, 3802)
  }

  function array(x, type) {
    if (!Array.isArray(x))
      return array(Array.from(arguments))

    return new Parameter(x, type || (x.length ? inferType(x) || 25 : 0), options.shared.typeArrayMap)
  }

  function handler(query) {
    if (ending)
      return query.reject(Errors.connection('CONNECTION_ENDED', options, options))

    if (open.length)
      return go(open.shift(), query)

    if (closed.length)
      return connect(closed.shift(), query)

    busy.length
      ? go(busy.shift(), query)
      : queries.push(query);
  }

  function go(c, query) {
    return c.execute(query)
      ? move(c, busy)
      : move(c, full)
  }

  function cancel(query) {
    return new Promise((resolve, reject) => {
      query.state
        ? query.active
          ? Connection(options).cancel(query.state, resolve, reject)
          : query.cancelled = { resolve, reject }
        : (
          queries.remove(query),
          query.cancelled = true,
          query.reject(Errors.generic('57014', 'canceling statement due to user request')),
          resolve()
        );
    })
  }

  async function end({ timeout = null } = {}) {
    if (ending)
      return ending

    await 1;
    let timer;
    return ending = Promise.race([
      new Promise(r => timeout !== null && (timer = setTimeout(destroy, timeout * 1000, r))),
      Promise.all(connections.map(c => c.end()).concat(
        listen.sql ? listen.sql.end({ timeout: 0 }) : [],
        subscribe.sql ? subscribe.sql.end({ timeout: 0 }) : []
      ))
    ]).then(() => clearTimeout(timer))
  }

  async function close() {
    await Promise.all(connections.map(c => c.end()));
  }

  async function destroy(resolve) {
    await Promise.all(connections.map(c => c.terminate()));
    while (queries.length)
      queries.shift().reject(Errors.connection('CONNECTION_DESTROYED', options));
    resolve();
  }

  function connect(c, query) {
    move(c, connecting);
    c.connect(query);
    return c
  }

  function onend(c) {
    move(c, ended);
  }

  function onopen(c) {
    if (queries.length === 0)
      return move(c, open)

    let max = Math.ceil(queries.length / (connecting.length + 1))
      , ready = true;

    while (ready && queries.length && max-- > 0) {
      const query = queries.shift();
      if (query.reserve)
        return query.reserve(c)

      ready = c.execute(query);
    }

    ready
      ? move(c, busy)
      : move(c, full);
  }

  function onclose(c, e) {
    move(c, closed);
    c.reserved = null;
    c.onclose && (c.onclose(e), c.onclose = null);
    options.onclose && options.onclose(c.id);
    queries.length && connect(c, queries.shift());
  }
}

function parseOptions(a, b) {
  if (a && a.shared)
    return a

  const env = process.env // eslint-disable-line
      , o = (!a || typeof a === 'string' ? b : a) || {}
      , { url, multihost } = parseUrl(a)
      , query = [...url.searchParams].reduce((a, [b, c]) => (a[b] = c, a), {})
      , host = o.hostname || o.host || multihost || url.hostname || env.PGHOST || 'localhost'
      , port = o.port || url.port || env.PGPORT || 5432
      , user = o.user || o.username || url.username || env.PGUSERNAME || env.PGUSER || osUsername();

  o.no_prepare && (o.prepare = false);
  query.sslmode && (query.ssl = query.sslmode, delete query.sslmode);
  'timeout' in o && (console.log('The timeout option is deprecated, use idle_timeout instead'), o.idle_timeout = o.timeout); // eslint-disable-line
  query.sslrootcert === 'system' && (query.ssl = 'verify-full');

  const ints = ['idle_timeout', 'connect_timeout', 'max_lifetime', 'max_pipeline', 'backoff', 'keep_alive'];
  const defaults = {
    max             : 10,
    ssl             : false,
    idle_timeout    : null,
    connect_timeout : 30,
    max_lifetime    : max_lifetime,
    max_pipeline    : 100,
    backoff         : backoff,
    keep_alive      : 60,
    prepare         : true,
    debug           : false,
    fetch_types     : true,
    publications    : 'alltables',
    target_session_attrs: null
  };

  return {
    host            : Array.isArray(host) ? host : host.split(',').map(x => x.split(':')[0]),
    port            : Array.isArray(port) ? port : host.split(',').map(x => parseInt(x.split(':')[1] || port)),
    path            : o.path || host.indexOf('/') > -1 && host + '/.s.PGSQL.' + port,
    database        : o.database || o.db || (url.pathname || '').slice(1) || env.PGDATABASE || user,
    user            : user,
    pass            : o.pass || o.password || url.password || env.PGPASSWORD || '',
    ...Object.entries(defaults).reduce(
      (acc, [k, d]) => {
        const value = k in o ? o[k] : k in query
          ? (query[k] === 'disable' || query[k] === 'false' ? false : query[k])
          : env['PG' + k.toUpperCase()] || d;
        acc[k] = typeof value === 'string' && ints.includes(k)
          ? +value
          : value;
        return acc
      },
      {}
    ),
    connection      : {
      application_name: env.PGAPPNAME || 'postgres.js',
      ...o.connection,
      ...Object.entries(query).reduce((acc, [k, v]) => (k in defaults || (acc[k] = v), acc), {})
    },
    types           : o.types || {},
    target_session_attrs: tsa(o, url, env),
    onnotice        : o.onnotice,
    onnotify        : o.onnotify,
    onclose         : o.onclose,
    onparameter     : o.onparameter,
    socket          : o.socket,
    transform       : parseTransform(o.transform || { undefined: undefined }),
    parameters      : {},
    shared          : { retries: 0, typeArrayMap: {} },
    ...mergeUserTypes(o.types)
  }
}

function tsa(o, url, env) {
  const x = o.target_session_attrs || url.searchParams.get('target_session_attrs') || env.PGTARGETSESSIONATTRS;
  if (!x || ['read-write', 'read-only', 'primary', 'standby', 'prefer-standby'].includes(x))
    return x

  throw new Error('target_session_attrs ' + x + ' is not supported')
}

function backoff(retries) {
  return (0.5 + Math.random() / 2) * Math.min(3 ** retries / 100, 20)
}

function max_lifetime() {
  return 60 * (30 + Math.random() * 30)
}

function parseTransform(x) {
  return {
    undefined: x.undefined,
    column: {
      from: typeof x.column === 'function' ? x.column : x.column && x.column.from,
      to: x.column && x.column.to
    },
    value: {
      from: typeof x.value === 'function' ? x.value : x.value && x.value.from,
      to: x.value && x.value.to
    },
    row: {
      from: typeof x.row === 'function' ? x.row : x.row && x.row.from,
      to: x.row && x.row.to
    }
  }
}

function parseUrl(url) {
  if (!url || typeof url !== 'string')
    return { url: { searchParams: new Map() } }

  let host = url;
  host = host.slice(host.indexOf('://') + 3).split(/[?/]/)[0];
  host = decodeURIComponent(host.slice(host.indexOf('@') + 1));

  const urlObj = new URL(url.replace(host, host.split(',')[0]));

  return {
    url: {
      username: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      searchParams: urlObj.searchParams
    },
    multihost: host.indexOf(',') > -1 && host
  }
}

function osUsername() {
  try {
    return os.userInfo().username // eslint-disable-line
  } catch (_) {
    return process.env.USERNAME || process.env.USER || process.env.LOGNAME  // eslint-disable-line
  }
}

function readMigrationFiles(config) {
  let migrationFolderTo;
  if (typeof config === "string") {
    const configAsString = fs$1.readFileSync(path.resolve(".", config), "utf8");
    const jsonConfig = JSON.parse(configAsString);
    migrationFolderTo = jsonConfig.out;
  } else {
    migrationFolderTo = config.migrationsFolder;
  }
  if (!migrationFolderTo) {
    throw new Error("no migration folder defined");
  }
  const migrationQueries = [];
  const journalPath = `${migrationFolderTo}/meta/_journal.json`;
  if (!fs$1.existsSync(journalPath)) {
    throw new Error(`Can't find meta/_journal.json file`);
  }
  const journalAsString = fs$1.readFileSync(`${migrationFolderTo}/meta/_journal.json`).toString();
  const journal = JSON.parse(journalAsString);
  for (const journalEntry of journal.entries) {
    const migrationPath = `${migrationFolderTo}/${journalEntry.tag}.sql`;
    try {
      const query = fs$1.readFileSync(`${migrationFolderTo}/${journalEntry.tag}.sql`).toString();
      const result = query.split("--> statement-breakpoint").map((it) => {
        return it;
      });
      migrationQueries.push({
        sql: result,
        bps: journalEntry.breakpoints,
        folderMillis: journalEntry.when,
        hash: crypto$1.createHash("sha256").update(query).digest("hex")
      });
    } catch {
      throw new Error(`No file ${migrationPath} found in ${migrationFolderTo} folder`);
    }
  }
  return migrationQueries;
}

async function migrate(db, config) {
  const migrations = readMigrationFiles(config);
  await db.dialect.migrate(migrations, db.session, config);
}

// Users table
const users = pgTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name'),
    passwordHash: text('password_hash'),
    emailVerified: boolean('email_verified').default(false),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    createdAtIdx: index('users_created_at_idx').on(table.createdAt)
}));
// Accounts table for OAuth providers
const accounts = pgTable('accounts', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    userIdIdx: index('accounts_user_id_idx').on(table.userId),
    providerIdx: index('accounts_provider_idx').on(table.provider),
    providerAccountUnique: unique('accounts_provider_account_unique').on(table.provider, table.providerAccountId)
}));
// Sessions table
const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    sessionToken: text('session_token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    sessionTokenIdx: index('sessions_session_token_idx').on(table.sessionToken),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt)
}));
// Verification tokens table (for email verification, password reset, etc.)
const verificationTokens = pgTable('verification_tokens', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(), // email or user id
    token: text('token').notNull(),
    type: text('type').notNull(), // 'email_verification', 'password_reset'
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
    identifierIdx: index('verification_tokens_identifier_idx').on(table.identifier),
    tokenIdx: index('verification_tokens_token_idx').on(table.token),
    expiresAtIdx: index('verification_tokens_expires_at_idx').on(table.expiresAt),
    tokenUnique: unique('verification_tokens_token_unique').on(table.token)
}));
// Relations
const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions)
}));
const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id]
    })
}));
const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id]
    })
}));
// Export schema object
const schema = {
    users,
    accounts,
    sessions,
    verificationTokens,
    usersRelations,
    accountsRelations,
    sessionsRelations
};

// Base user schema
const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    emailVerified: z.boolean().default(false),
    image: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// Account schema for OAuth providers
const AccountSchema = z.object({
    id: z.string(),
    userId: z.string(),
    provider: z.string(),
    providerAccountId: z.string(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    expiresAt: z.number().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// Session schema
const SessionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    sessionToken: z.string(),
    expiresAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// Auth configuration
const AuthConfigSchema = z.object({
    database: z.object({
        type: z.literal('postgres'),
        url: z.string().url()
    }),
    session: z.object({
        strategy: z.enum(['database', 'jwt']).default('database'),
        maxAge: z.number().default(30 * 24 * 60 * 60), // 30 days
        secret: z.string().min(32)
    }),
    providers: z.object({
        emailPassword: z.object({
            enabled: z.boolean().default(false)
        }).optional(),
        google: z.object({
            clientId: z.string(),
            clientSecret: z.string(),
            scope: z.string().default('openid email profile')
        }).optional(),
        github: z.object({
            clientId: z.string(),
            clientSecret: z.string(),
            scope: z.string().default('user:email')
        }).optional()
    }),
    callbacks: z.object({
        onSignUp: z.function().args(z.object({ user: UserSchema })).returns(z.void()).optional(),
        onSignIn: z.function().args(z.object({ user: UserSchema, account: AccountSchema.optional() })).returns(z.void()).optional(),
        onSignOut: z.function().args(z.object({ user: UserSchema })).returns(z.void()).optional()
    }).optional()
});
// Error types
class AuthError extends Error {
    constructor(message, code, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = 'AuthError';
    }
}
class ConfigError extends AuthError {
    constructor(message) {
        super(message, 'CONFIG_ERROR', 500);
    }
}
class DatabaseError extends AuthError {
    constructor(message) {
        super(message, 'DATABASE_ERROR', 500);
    }
}
class ValidationError extends AuthError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}

class Database {
    constructor(connectionString) {
        try {
            this.client = Postgres(connectionString, {
                max: 10,
                idle_timeout: 20,
                connect_timeout: 10,
            });
            this.db = drizzle(this.client, { schema });
        }
        catch (error) {
            throw new DatabaseError(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async testConnection() {
        try {
            await this.client `SELECT 1`;
        }
        catch (error) {
            throw new DatabaseError(`Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async migrate(migrationsFolder = './drizzle') {
        try {
            await migrate(this.db, { migrationsFolder });
        }
        catch (error) {
            throw new DatabaseError(`Database migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async close() {
        try {
            await this.client.end();
        }
        catch (error) {
            throw new DatabaseError(`Failed to close database connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Utility method to create tables if they don't exist
    async ensureTablesExist() {
        try {
            // Check if users table exists
            const result = await this.client `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `;
            if (!result[0]?.exists) {
                throw new DatabaseError('Database tables do not exist. Please run migrations or ensure the database is properly set up.');
            }
        }
        catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw new DatabaseError(`Failed to verify database tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Cleanup expired sessions
    async cleanupExpiredSessions() {
        try {
            const result = await this.db
                .delete(schema.sessions)
                .where(sql$1 `expires_at < NOW()`)
                .returning({ id: schema.sessions.id });
            return result.length;
        }
        catch (error) {
            throw new DatabaseError(`Failed to cleanup expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Cleanup expired verification tokens
    async cleanupExpiredTokens() {
        try {
            const result = await this.db
                .delete(schema.verificationTokens)
                .where(sql$1 `expires_at < NOW()`)
                .returning({ id: schema.verificationTokens.id });
            return result.length;
        }
        catch (error) {
            throw new DatabaseError(`Failed to cleanup expired tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

// ID generation
function generateId(prefix) {
    const id = nanoid(21); // 21 characters for good uniqueness
    return prefix ? `${prefix}_${id}` : id;
}
function generateUserId() {
    return generateId('user');
}
function generateAccountId() {
    return generateId('acc');
}
function generateSessionId() {
    return generateId('sess');
}
function generateSessionToken() {
    return nanoid(32); // Longer token for sessions
}
function generateVerificationToken() {
    return nanoid(32);
}
// Password utilities
async function hashPassword(password) {
    try {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }
    catch (error) {
        throw new AuthError('Failed to hash password', 'HASH_ERROR', 500);
    }
}
async function verifyPassword(password, hash) {
    try {
        return await bcrypt.compare(password, hash);
    }
    catch (error) {
        throw new AuthError('Failed to verify password', 'VERIFY_ERROR', 500);
    }
}
// JWT utilities
function createJWT(payload, secret, expiresIn = '30d') {
    try {
        return jwt.sign(payload, secret, { expiresIn });
    }
    catch (error) {
        throw new AuthError('Failed to create JWT', 'JWT_CREATE_ERROR', 500);
    }
}
function verifyJWT(token, secret) {
    try {
        return jwt.verify(token, secret);
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AuthError('Token expired', 'TOKEN_EXPIRED', 401);
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AuthError('Invalid token', 'INVALID_TOKEN', 401);
        }
        throw new AuthError('Token verification failed', 'TOKEN_ERROR', 401);
    }
}
// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function validatePasswordStrength(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
// URL utilities
function buildURL(base, path, params) {
    const url = new URL(path, base);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
    }
    return url.toString();
}
function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
function isExpired(date) {
    return date.getTime() < Date.now();
}
function serializeCookie(name, value, options = {}) {
    const opts = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        ...options
    };
    let cookie = `${name}=${encodeURIComponent(value)}`;
    if (opts.maxAge) {
        cookie += `; Max-Age=${opts.maxAge}`;
    }
    if (opts.path) {
        cookie += `; Path=${opts.path}`;
    }
    if (opts.domain) {
        cookie += `; Domain=${opts.domain}`;
    }
    if (opts.httpOnly) {
        cookie += '; HttpOnly';
    }
    if (opts.secure) {
        cookie += '; Secure';
    }
    if (opts.sameSite) {
        cookie += `; SameSite=${opts.sameSite}`;
    }
    return cookie;
}
function parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            cookies[name] = decodeURIComponent(value);
        }
    });
    return cookies;
}

class PasswordAuth {
    constructor(db) {
        this.db = db;
    }
    async signUp(email, password, name) {
        try {
            // Validate input
            if (!isValidEmail(email)) {
                return {
                    success: false,
                    error: 'Invalid email address'
                };
            }
            const passwordValidation = validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    error: passwordValidation.errors.join(', ')
                };
            }
            // Check if user already exists
            const existingUser = await this.db.db
                .select()
                .from(schema.users)
                .where(eq$1(schema.users.email, email.toLowerCase()))
                .limit(1);
            if (existingUser.length > 0) {
                return {
                    success: false,
                    error: 'User already exists with this email'
                };
            }
            // Hash password
            const passwordHash = await hashPassword(password);
            // Create user
            const userId = generateUserId();
            const now = new Date();
            const [newUser] = await this.db.db
                .insert(schema.users)
                .values({
                id: userId,
                email: email.toLowerCase(),
                name: name || null,
                passwordHash,
                emailVerified: false,
                createdAt: now,
                updatedAt: now
            })
                .returning();
            const user = {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name || undefined,
                emailVerified: newUser.emailVerified,
                image: newUser.image || undefined,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt
            };
            return {
                success: true,
                user,
                requiresVerification: !user.emailVerified
            };
        }
        catch (error) {
            if (error instanceof AuthError) {
                return {
                    success: false,
                    error: error.message
                };
            }
            throw new DatabaseError(`Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async signIn(email, password) {
        try {
            // Validate input
            if (!isValidEmail(email)) {
                return {
                    success: false,
                    error: 'Invalid email address'
                };
            }
            if (!password) {
                return {
                    success: false,
                    error: 'Password is required'
                };
            }
            // Find user
            const [dbUser] = await this.db.db
                .select()
                .from(schema.users)
                .where(eq$1(schema.users.email, email.toLowerCase()))
                .limit(1);
            if (!dbUser || !dbUser.passwordHash) {
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }
            // Verify password
            const isValidPassword = await verifyPassword(password, dbUser.passwordHash);
            if (!isValidPassword) {
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }
            const user = {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name || undefined,
                emailVerified: dbUser.emailVerified,
                image: dbUser.image || undefined,
                createdAt: dbUser.createdAt,
                updatedAt: dbUser.updatedAt
            };
            return {
                success: true,
                user
            };
        }
        catch (error) {
            if (error instanceof AuthError) {
                return {
                    success: false,
                    error: error.message
                };
            }
            throw new DatabaseError(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updatePassword(userId, oldPassword, newPassword) {
        try {
            // Get user
            const [user] = await this.db.db
                .select()
                .from(schema.users)
                .where(eq$1(schema.users.id, userId))
                .limit(1);
            if (!user || !user.passwordHash) {
                throw new ValidationError('User not found or password not set');
            }
            // Verify old password
            const isValidOldPassword = await verifyPassword(oldPassword, user.passwordHash);
            if (!isValidOldPassword) {
                throw new ValidationError('Current password is incorrect');
            }
            // Validate new password
            const passwordValidation = validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new ValidationError(passwordValidation.errors.join(', '));
            }
            // Hash new password
            const newPasswordHash = await hashPassword(newPassword);
            // Update password
            await this.db.db
                .update(schema.users)
                .set({
                passwordHash: newPasswordHash,
                updatedAt: new Date()
            })
                .where(eq$1(schema.users.id, userId));
            return true;
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new DatabaseError(`Password update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async resetPassword(email, newPassword, token) {
        try {
            // Validate new password
            const passwordValidation = validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new ValidationError(passwordValidation.errors.join(', '));
            }
            // Verify token and get user
            const [verificationToken] = await this.db.db
                .select()
                .from(schema.verificationTokens)
                .where(eq$1(schema.verificationTokens.token, token))
                .limit(1);
            if (!verificationToken || verificationToken.type !== 'password_reset') {
                throw new ValidationError('Invalid or expired reset token');
            }
            if (verificationToken.expiresAt < new Date()) {
                throw new ValidationError('Reset token has expired');
            }
            if (verificationToken.identifier !== email.toLowerCase()) {
                throw new ValidationError('Token does not match email');
            }
            // Hash new password
            const passwordHash = await hashPassword(newPassword);
            // Update password
            await this.db.db
                .update(schema.users)
                .set({
                passwordHash,
                updatedAt: new Date()
            })
                .where(eq$1(schema.users.email, email.toLowerCase()));
            // Delete used token
            await this.db.db
                .delete(schema.verificationTokens)
                .where(eq$1(schema.verificationTokens.id, verificationToken.id));
            return true;
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new DatabaseError(`Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Generate password reset token
    async generatePasswordResetToken(email) {
        try {
            // Check if user exists
            const [user] = await this.db.db
                .select()
                .from(schema.users)
                .where(eq$1(schema.users.email, email.toLowerCase()))
                .limit(1);
            if (!user) {
                // Don't reveal if user exists or not
                return null;
            }
            // Generate token
            const token = generateVerificationToken();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
            // Store token
            await this.db.db
                .insert(schema.verificationTokens)
                .values({
                id: generateId('vrfy'),
                identifier: email.toLowerCase(),
                token,
                type: 'password_reset',
                expiresAt,
                createdAt: new Date()
            });
            return token;
        }
        catch (error) {
            throw new DatabaseError(`Failed to generate reset token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

class OAuthManager {
    constructor(db) {
        this.db = db;
        this.providers = new Map();
        this.initializeDefaultProviders();
    }
    initializeDefaultProviders() {
        // Google OAuth provider
        this.providers.set('google', {
            id: 'google',
            name: 'Google',
            authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
            clientId: '',
            clientSecret: '',
            scope: 'openid email profile'
        });
        // GitHub OAuth provider
        this.providers.set('github', {
            id: 'github',
            name: 'GitHub',
            authorizationUrl: 'https://github.com/login/oauth/authorize',
            tokenUrl: 'https://github.com/login/oauth/access_token',
            userInfoUrl: 'https://api.github.com/user',
            clientId: '',
            clientSecret: '',
            scope: 'user:email'
        });
        // Facebook OAuth provider
        this.providers.set('facebook', {
            id: 'facebook',
            name: 'Facebook',
            authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
            tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
            userInfoUrl: 'https://graph.facebook.com/v18.0/me',
            clientId: '',
            clientSecret: '',
            scope: 'email'
        });
    }
    configureProvider(providerId, config) {
        const provider = this.providers.get(providerId);
        if (!provider) {
            throw new ValidationError(`Unknown OAuth provider: ${providerId}`);
        }
        provider.clientId = config.clientId;
        provider.clientSecret = config.clientSecret;
        if (config.scope) {
            provider.scope = config.scope;
        }
    }
    addCustomProvider(provider) {
        this.providers.set(provider.id, provider);
    }
    generateAuthorizationUrl(providerId, redirectUri, state) {
        const provider = this.providers.get(providerId);
        if (!provider) {
            throw new ValidationError(`Unknown OAuth provider: ${providerId}`);
        }
        if (!provider.clientId) {
            throw new ValidationError(`OAuth provider ${providerId} is not configured`);
        }
        const params = {
            client_id: provider.clientId,
            redirect_uri: redirectUri,
            scope: provider.scope,
            response_type: 'code',
            state
        };
        // Provider-specific parameters
        if (providerId === 'google') {
            params.access_type = 'offline';
            params.prompt = 'consent';
        }
        return buildURL(provider.authorizationUrl, '', params);
    }
    async handleCallback(providerId, code, redirectUri, state) {
        try {
            const provider = this.providers.get(providerId);
            if (!provider) {
                return {
                    success: false,
                    error: 'Unknown OAuth provider'
                };
            }
            // Exchange code for tokens
            const tokens = await this.exchangeCodeForTokens(provider, code, redirectUri);
            // Get user profile
            const profile = await this.getUserProfile(provider, tokens.access_token);
            if (!profile.email) {
                return {
                    success: false,
                    error: 'Email not provided by OAuth provider'
                };
            }
            // Find or create user
            const result = await this.findOrCreateUser(profile, provider.id, tokens);
            return result;
        }
        catch (error) {
            if (error instanceof AuthError) {
                return {
                    success: false,
                    error: error.message
                };
            }
            return {
                success: false,
                error: 'OAuth authentication failed'
            };
        }
    }
    async exchangeCodeForTokens(provider, code, redirectUri) {
        const params = new URLSearchParams({
            client_id: provider.clientId,
            client_secret: provider.clientSecret,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        });
        const response = await fetch(provider.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: params.toString()
        });
        if (!response.ok) {
            throw new AuthError('Failed to exchange authorization code for tokens', 'OAUTH_TOKEN_ERROR');
        }
        const tokens = await response.json();
        if (!tokens.access_token) {
            throw new AuthError('No access token received from OAuth provider', 'OAUTH_TOKEN_ERROR');
        }
        return tokens;
    }
    async getUserProfile(provider, accessToken) {
        let url = provider.userInfoUrl;
        let headers = {
            'Authorization': `Bearer ${accessToken}`
        };
        // Provider-specific adjustments
        if (provider.id === 'facebook') {
            url = `${provider.userInfoUrl}?fields=id,email,name,picture`;
        }
        else if (provider.id === 'github') {
            headers['User-Agent'] = 'easy-auth-sdk';
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new AuthError('Failed to fetch user profile from OAuth provider', 'OAUTH_PROFILE_ERROR');
        }
        const data = await response.json();
        // Normalize profile data across providers
        let profile = {
            id: String(data.id),
            email: data.email,
            name: data.name || data.login, // GitHub uses 'login' instead of 'name'
        };
        // Handle profile images
        if (provider.id === 'google') {
            profile.image = data.picture;
        }
        else if (provider.id === 'github') {
            profile.image = data.avatar_url;
        }
        else if (provider.id === 'facebook') {
            profile.image = data.picture?.data?.url;
        }
        // For GitHub, we need to fetch the email separately if it's not public
        if (provider.id === 'github' && !profile.email) {
            const emailResponse = await fetch('https://api.github.com/user/emails', { headers });
            if (emailResponse.ok) {
                const emails = await emailResponse.json();
                const primaryEmail = emails.find((email) => email.primary);
                if (primaryEmail) {
                    profile.email = primaryEmail.email;
                }
            }
        }
        return profile;
    }
    async findOrCreateUser(profile, providerId, tokens) {
        try {
            // Look for existing account
            const [existingAccount] = await this.db.db
                .select()
                .from(schema.accounts)
                .innerJoin(schema.users, eq$1(schema.accounts.userId, schema.users.id))
                .where(and$1(eq$1(schema.accounts.provider, providerId), eq$1(schema.accounts.providerAccountId, profile.id)))
                .limit(1);
            if (existingAccount) {
                // Update tokens
                await this.updateAccountTokens(existingAccount.accounts.id, tokens);
                const user = {
                    id: existingAccount.users.id,
                    email: existingAccount.users.email,
                    name: existingAccount.users.name || undefined,
                    emailVerified: existingAccount.users.emailVerified,
                    image: existingAccount.users.image || undefined,
                    createdAt: existingAccount.users.createdAt,
                    updatedAt: existingAccount.users.updatedAt
                };
                return {
                    success: true,
                    user
                };
            }
            // Look for existing user by email (account linking)
            let user = null;
            if (profile.email) {
                const [existingUser] = await this.db.db
                    .select()
                    .from(schema.users)
                    .where(eq$1(schema.users.email, profile.email.toLowerCase()))
                    .limit(1);
                if (existingUser) {
                    user = existingUser;
                }
            }
            // Create new user if needed
            if (!user && profile.email) {
                const userId = generateUserId();
                const now = new Date();
                const [newUser] = await this.db.db
                    .insert(schema.users)
                    .values({
                    id: userId,
                    email: profile.email.toLowerCase(),
                    name: profile.name || null,
                    emailVerified: true, // OAuth emails are considered verified
                    image: profile.image || null,
                    createdAt: now,
                    updatedAt: now
                })
                    .returning();
                user = newUser;
            }
            if (!user) {
                return {
                    success: false,
                    error: 'Unable to create user account'
                };
            }
            // Create account link
            await this.createAccountLink(user.id, providerId, profile.id, tokens);
            const resultUser = {
                id: user.id,
                email: user.email,
                name: user.name || undefined,
                emailVerified: user.emailVerified,
                image: user.image || undefined,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
            return {
                success: true,
                user: resultUser
            };
        }
        catch (error) {
            throw new DatabaseError(`Failed to find or create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createAccountLink(userId, providerId, providerAccountId, tokens) {
        const accountId = generateAccountId();
        const now = new Date();
        await this.db.db
            .insert(schema.accounts)
            .values({
            id: accountId,
            userId,
            provider: providerId,
            providerAccountId,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
            tokenType: tokens.token_type || 'Bearer',
            scope: tokens.scope || null,
            idToken: tokens.id_token || null,
            createdAt: now,
            updatedAt: now
        });
    }
    async updateAccountTokens(accountId, tokens) {
        await this.db.db
            .update(schema.accounts)
            .set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
            updatedAt: new Date()
        })
            .where(eq$1(schema.accounts.id, accountId));
    }
    getProvider(providerId) {
        return this.providers.get(providerId);
    }
    getConfiguredProviders() {
        return Array.from(this.providers.values()).filter(provider => provider.clientId && provider.clientSecret);
    }
}

class SessionManager {
    constructor(db, config) {
        this.db = db;
        this.cookieName = 'easy-auth-session';
        this.strategy = config.session.strategy;
        this.maxAge = config.session.maxAge;
        this.secret = config.session.secret;
    }
    async createSession(user) {
        const sessionId = generateSessionId();
        const sessionToken = generateSessionToken();
        const expiresAt = addDays(new Date(), this.maxAge / (24 * 60 * 60)); // Convert seconds to days
        const now = new Date();
        if (this.strategy === 'database') {
            // Store session in database
            const [session] = await this.db.db
                .insert(schema.sessions)
                .values({
                id: sessionId,
                userId: user.id,
                sessionToken,
                expiresAt,
                createdAt: now,
                updatedAt: now
            })
                .returning();
            return {
                id: session.id,
                userId: session.userId,
                sessionToken: session.sessionToken,
                expiresAt: session.expiresAt,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            };
        }
        else {
            // JWT strategy - create token with user data
            const jwtPayload = {
                sub: user.id,
                email: user.email,
                name: user.name,
                emailVerified: user.emailVerified,
                image: user.image,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(expiresAt.getTime() / 1000)
            };
            const jwt = createJWT(jwtPayload, this.secret, `${this.maxAge}s`);
            return {
                id: sessionId,
                userId: user.id,
                sessionToken: jwt,
                expiresAt,
                createdAt: now,
                updatedAt: now
            };
        }
    }
    async getSession(sessionToken) {
        try {
            if (this.strategy === 'database') {
                return await this.getDatabaseSession(sessionToken);
            }
            else {
                return await this.getJWTSession(sessionToken);
            }
        }
        catch (error) {
            // Invalid or expired sessions should return null, not throw
            if (error instanceof AuthError && (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN')) {
                return null;
            }
            throw error;
        }
    }
    async getDatabaseSession(sessionToken) {
        const [result] = await this.db.db
            .select()
            .from(schema.sessions)
            .innerJoin(schema.users, eq$1(schema.sessions.userId, schema.users.id))
            .where(and$1(eq$1(schema.sessions.sessionToken, sessionToken), gt$1(schema.sessions.expiresAt, new Date())))
            .limit(1);
        if (!result) {
            return null;
        }
        const session = {
            id: result.sessions.id,
            userId: result.sessions.userId,
            sessionToken: result.sessions.sessionToken,
            expiresAt: result.sessions.expiresAt,
            createdAt: result.sessions.createdAt,
            updatedAt: result.sessions.updatedAt
        };
        const user = {
            id: result.users.id,
            email: result.users.email,
            name: result.users.name || undefined,
            emailVerified: result.users.emailVerified,
            image: result.users.image || undefined,
            createdAt: result.users.createdAt,
            updatedAt: result.users.updatedAt
        };
        return { user, session };
    }
    async getJWTSession(sessionToken) {
        try {
            const payload = verifyJWT(sessionToken, this.secret);
            // Check if token is expired (additional check)
            if (payload.exp < Math.floor(Date.now() / 1000)) {
                return null;
            }
            const user = {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                emailVerified: payload.emailVerified,
                image: payload.image,
                createdAt: new Date(payload.iat * 1000),
                updatedAt: new Date(payload.iat * 1000)
            };
            const session = {
                id: `jwt_${payload.sub}`,
                userId: payload.sub,
                sessionToken,
                expiresAt: new Date(payload.exp * 1000),
                createdAt: new Date(payload.iat * 1000),
                updatedAt: new Date(payload.iat * 1000)
            };
            return { user, session };
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError('Invalid session token', 'INVALID_TOKEN', 401);
        }
    }
    async updateSession(sessionToken) {
        if (this.strategy === 'jwt') {
            // JWT sessions don't need updating
            const sessionData = await this.getJWTSession(sessionToken);
            return sessionData?.session || null;
        }
        try {
            const now = new Date();
            const [updatedSession] = await this.db.db
                .update(schema.sessions)
                .set({ updatedAt: now })
                .where(and$1(eq$1(schema.sessions.sessionToken, sessionToken), gt$1(schema.sessions.expiresAt, now)))
                .returning();
            if (!updatedSession) {
                return null;
            }
            return {
                id: updatedSession.id,
                userId: updatedSession.userId,
                sessionToken: updatedSession.sessionToken,
                expiresAt: updatedSession.expiresAt,
                createdAt: updatedSession.createdAt,
                updatedAt: updatedSession.updatedAt
            };
        }
        catch (error) {
            throw new DatabaseError(`Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteSession(sessionToken) {
        if (this.strategy === 'jwt') {
            // JWT sessions can't be deleted from server side
            // They expire naturally or need to be blacklisted (not implemented here)
            return true;
        }
        try {
            const result = await this.db.db
                .delete(schema.sessions)
                .where(eq$1(schema.sessions.sessionToken, sessionToken))
                .returning({ id: schema.sessions.id });
            return result.length > 0;
        }
        catch (error) {
            throw new DatabaseError(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteAllUserSessions(userId) {
        if (this.strategy === 'jwt') {
            // JWT sessions can't be deleted from server side
            return 0;
        }
        try {
            const result = await this.db.db
                .delete(schema.sessions)
                .where(eq$1(schema.sessions.userId, userId))
                .returning({ id: schema.sessions.id });
            return result.length;
        }
        catch (error) {
            throw new DatabaseError(`Failed to delete user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async cleanupExpiredSessions() {
        if (this.strategy === 'jwt') {
            // JWT sessions expire naturally
            return 0;
        }
        try {
            const result = await this.db.db
                .delete(schema.sessions)
                .where(sql$1 `expires_at < NOW()`)
                .returning({ id: schema.sessions.id });
            return result.length;
        }
        catch (error) {
            throw new DatabaseError(`Failed to cleanup expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Cookie helpers
    createSessionCookie(sessionToken, options = {}) {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: this.maxAge,
            ...options
        };
        return serializeCookie(this.cookieName, sessionToken, cookieOptions);
    }
    getSessionFromCookies(cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        return cookies[this.cookieName] || null;
    }
    createLogoutCookie(options = {}) {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0, // Expire immediately
            ...options
        };
        return serializeCookie(this.cookieName, '', cookieOptions);
    }
    // Session validation
    async validateSession(sessionToken) {
        const sessionData = await this.getSession(sessionToken);
        if (!sessionData) {
            return null;
        }
        // Check if session is expired
        if (isExpired(sessionData.session.expiresAt)) {
            // Clean up expired session if using database strategy
            if (this.strategy === 'database') {
                await this.deleteSession(sessionToken);
            }
            return null;
        }
        // Update session activity if using database strategy
        if (this.strategy === 'database') {
            await this.updateSession(sessionToken);
        }
        return sessionData;
    }
    // Get session info without validation (for debugging)
    async getSessionInfo(sessionToken) {
        try {
            const sessionData = await this.getSession(sessionToken);
            if (!sessionData) {
                return { valid: false, expired: false, error: 'Session not found' };
            }
            const expired = isExpired(sessionData.session.expiresAt);
            return {
                valid: !expired,
                expired,
                user: sessionData.user,
                session: sessionData.session
            };
        }
        catch (error) {
            return {
                valid: false,
                expired: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

class AuthEngine {
    constructor(config, callbacks = {}) {
        this.config = this.validateConfig(config);
        this.callbacks = callbacks;
        // Initialize database
        this.db = new Database(config.database.url);
        // Initialize auth components
        this.passwordAuth = new PasswordAuth(this.db);
        this.oauthManager = new OAuthManager(this.db);
        this.sessionManager = new SessionManager(this.db, config);
        // Configure OAuth providers
        this.configureOAuthProviders();
    }
    validateConfig(config) {
        try {
            return config; // Assumes validation is done by Zod schema at higher level
        }
        catch (error) {
            throw new ConfigError(`Invalid configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    configureOAuthProviders() {
        const providers = this.config.providers;
        if (providers.google) {
            this.oauthManager.configureProvider('google', {
                clientId: providers.google.clientId,
                clientSecret: providers.google.clientSecret,
                scope: providers.google.scope || 'openid email profile'
            });
        }
        if (providers.github) {
            this.oauthManager.configureProvider('github', {
                clientId: providers.github.clientId,
                clientSecret: providers.github.clientSecret,
                scope: providers.github.scope || 'user:email'
            });
        }
    }
    // Initialize the auth engine
    async initialize() {
        await this.db.testConnection();
        await this.db.ensureTablesExist();
    }
    // Password authentication
    async signUpWithPassword(email, password, name) {
        if (!this.config.providers.emailPassword?.enabled) {
            return {
                success: false,
                error: 'Password authentication is not enabled'
            };
        }
        const result = await this.passwordAuth.signUp(email, password, name);
        if (result.success && result.user && this.callbacks.onSignUp) {
            try {
                await this.callbacks.onSignUp({ user: result.user });
            }
            catch (error) {
                // Log callback error but don't fail the signup
                console.error('Sign up callback error:', error);
            }
        }
        return result;
    }
    async signInWithPassword(email, password) {
        if (!this.config.providers.emailPassword?.enabled) {
            return {
                result: {
                    success: false,
                    error: 'Password authentication is not enabled'
                }
            };
        }
        const result = await this.passwordAuth.signIn(email, password);
        if (result.success && result.user) {
            const session = await this.sessionManager.createSession(result.user);
            if (this.callbacks.onSignIn) {
                try {
                    await this.callbacks.onSignIn({ user: result.user });
                }
                catch (error) {
                    console.error('Sign in callback error:', error);
                }
            }
            return {
                result: { ...result, session },
                session
            };
        }
        return { result };
    }
    // OAuth authentication
    getOAuthAuthorizationUrl(provider, redirectUri, state) {
        const providerConfig = this.config.providers[provider];
        if (!providerConfig) {
            throw new AuthError(`OAuth provider ${provider} is not configured`, 'PROVIDER_NOT_CONFIGURED');
        }
        return this.oauthManager.generateAuthorizationUrl(provider, redirectUri, state);
    }
    async handleOAuthCallback(provider, code, redirectUri, state) {
        const providerConfig = this.config.providers[provider];
        if (!providerConfig) {
            return {
                result: {
                    success: false,
                    error: `OAuth provider ${provider} is not configured`
                }
            };
        }
        const result = await this.oauthManager.handleCallback(provider, code, redirectUri, state);
        if (result.success && result.user) {
            const session = await this.sessionManager.createSession(result.user);
            if (this.callbacks.onSignIn) {
                try {
                    await this.callbacks.onSignIn({ user: result.user });
                }
                catch (error) {
                    console.error('OAuth sign in callback error:', error);
                }
            }
            return {
                result: { ...result, session },
                session
            };
        }
        return { result };
    }
    // Session management
    async getSession(sessionToken) {
        return await this.sessionManager.validateSession(sessionToken);
    }
    async refreshSession(sessionToken) {
        return await this.sessionManager.updateSession(sessionToken);
    }
    async signOut(sessionToken) {
        const sessionData = await this.sessionManager.getSession(sessionToken);
        if (sessionData && this.callbacks.onSignOut) {
            try {
                await this.callbacks.onSignOut({ user: sessionData.user });
            }
            catch (error) {
                console.error('Sign out callback error:', error);
            }
        }
        return await this.sessionManager.deleteSession(sessionToken);
    }
    async signOutAllSessions(userId) {
        return await this.sessionManager.deleteAllUserSessions(userId);
    }
    // User management
    async updatePassword(userId, oldPassword, newPassword) {
        if (!this.config.providers.emailPassword?.enabled) {
            throw new AuthError('Password authentication is not enabled', 'PASSWORD_AUTH_DISABLED');
        }
        return await this.passwordAuth.updatePassword(userId, oldPassword, newPassword);
    }
    async requestPasswordReset(email) {
        if (!this.config.providers.emailPassword?.enabled) {
            throw new AuthError('Password authentication is not enabled', 'PASSWORD_AUTH_DISABLED');
        }
        return await this.passwordAuth.generatePasswordResetToken(email);
    }
    async resetPassword(email, newPassword, token) {
        if (!this.config.providers.emailPassword?.enabled) {
            throw new AuthError('Password authentication is not enabled', 'PASSWORD_AUTH_DISABLED');
        }
        return await this.passwordAuth.resetPassword(email, newPassword, token);
    }
    // Utility methods
    createSessionCookie(sessionToken) {
        return this.sessionManager.createSessionCookie(sessionToken);
    }
    createLogoutCookie() {
        return this.sessionManager.createLogoutCookie();
    }
    getSessionFromCookies(cookieHeader) {
        return this.sessionManager.getSessionFromCookies(cookieHeader);
    }
    getConfiguredOAuthProviders() {
        return this.oauthManager.getConfiguredProviders().map(provider => ({
            id: provider.id,
            name: provider.name
        }));
    }
    // Maintenance
    async cleanupExpiredSessions() {
        return await this.sessionManager.cleanupExpiredSessions();
    }
    async cleanupExpiredTokens() {
        return await this.db.cleanupExpiredTokens();
    }
    // Database access (for advanced usage)
    getDatabase() {
        return this.db;
    }
    // Graceful shutdown
    async close() {
        await this.db.close();
    }
    // Health check
    async health() {
        try {
            await this.db.testConnection();
            return { status: 'ok', database: true };
        }
        catch (error) {
            return {
                status: 'error',
                database: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

/**
 * EasyAuth - Main SDK class for authentication
 *
 * This is the primary interface developers will use to integrate authentication
 * into their applications. It provides a simple, intuitive API while handling
 * all the complexity of authentication flows, session management, and security.
 */
class EasyAuth {
    constructor(config, callbacks) {
        this.initialized = false;
        // Validate configuration
        const validatedConfig = this.validateConfig(config);
        // Initialize the auth engine
        this.engine = new AuthEngine(validatedConfig, callbacks);
    }
    validateConfig(config) {
        try {
            return AuthConfigSchema.parse(config);
        }
        catch (error) {
            throw new ConfigError(`Invalid EasyAuth configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Initialize the authentication system
     * Must be called before using any other methods
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        await this.engine.initialize();
        this.initialized = true;
    }
    /**
     * Sign up a new user with email and password
     */
    async signUp(email, password, name) {
        this.ensureInitialized();
        return await this.engine.signUpWithPassword(email, password, name);
    }
    /**
     * Sign in a user with email and password
     */
    async signIn(email, password) {
        this.ensureInitialized();
        const { result, session } = await this.engine.signInWithPassword(email, password);
        if (result.success && session) {
            return {
                ...result,
                session,
                sessionCookie: this.engine.createSessionCookie(session.sessionToken)
            };
        }
        return result;
    }
    /**
     * Get OAuth authorization URL for a provider
     */
    getOAuthURL(provider, redirectUri, state) {
        this.ensureInitialized();
        const stateParam = state || this.generateState();
        return this.engine.getOAuthAuthorizationUrl(provider, redirectUri, stateParam);
    }
    /**
     * Handle OAuth callback and sign in user
     */
    async handleOAuthCallback(provider, code, redirectUri, state) {
        this.ensureInitialized();
        const { result, session } = await this.engine.handleOAuthCallback(provider, code, redirectUri, state);
        if (result.success && session) {
            return {
                ...result,
                session,
                sessionCookie: this.engine.createSessionCookie(session.sessionToken)
            };
        }
        return result;
    }
    /**
     * Get current user session
     */
    async getSession(sessionToken) {
        this.ensureInitialized();
        return await this.engine.getSession(sessionToken);
    }
    /**
     * Get session from cookie header
     */
    getSessionFromCookies(cookieHeader) {
        return this.engine.getSessionFromCookies(cookieHeader);
    }
    /**
     * Sign out user and invalidate session
     */
    async signOut(sessionToken) {
        this.ensureInitialized();
        const success = await this.engine.signOut(sessionToken);
        const logoutCookie = this.engine.createLogoutCookie();
        return { success, logoutCookie };
    }
    /**
     * Sign out user from all sessions
     */
    async signOutAll(userId) {
        this.ensureInitialized();
        return await this.engine.signOutAllSessions(userId);
    }
    /**
     * Update user password
     */
    async updatePassword(userId, oldPassword, newPassword) {
        this.ensureInitialized();
        return await this.engine.updatePassword(userId, oldPassword, newPassword);
    }
    /**
     * Request password reset token
     */
    async requestPasswordReset(email) {
        this.ensureInitialized();
        return await this.engine.requestPasswordReset(email);
    }
    /**
     * Reset password with token
     */
    async resetPassword(email, newPassword, token) {
        this.ensureInitialized();
        return await this.engine.resetPassword(email, newPassword, token);
    }
    /**
     * Get list of configured OAuth providers
     */
    getProviders() {
        return this.engine.getConfiguredOAuthProviders();
    }
    /**
     * Check if authentication system is healthy
     */
    async health() {
        if (!this.initialized) {
            return { status: 'error', database: false, error: 'Not initialized' };
        }
        return await this.engine.health();
    }
    /**
     * Cleanup expired sessions and tokens
     */
    async cleanupExpired() {
        this.ensureInitialized();
        const [sessions, tokens] = await Promise.all([
            this.engine.cleanupExpiredSessions(),
            this.engine.cleanupExpiredTokens()
        ]);
        return { sessions, tokens };
    }
    /**
     * Get access to the underlying database (for advanced usage)
     */
    getDatabase() {
        this.ensureInitialized();
        return this.engine.getDatabase();
    }
    /**
     * Gracefully shutdown the authentication system
     */
    async close() {
        if (this.initialized) {
            await this.engine.close();
            this.initialized = false;
        }
    }
    // Helper methods
    ensureInitialized() {
        if (!this.initialized) {
            throw new ConfigError('EasyAuth must be initialized before use. Call initialize() first.');
        }
    }
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    /**
     * Create a middleware function for protecting routes
     * Returns a function that can be used in web frameworks
     */
    requireAuth() {
        return async (req, res, next) => {
            this.ensureInitialized();
            try {
                const sessionToken = this.getSessionFromRequest(req);
                if (!sessionToken) {
                    return this.handleUnauthorized(res, 'No session token provided');
                }
                const sessionData = await this.getSession(sessionToken);
                if (!sessionData) {
                    return this.handleUnauthorized(res, 'Invalid or expired session');
                }
                // Attach user to request object
                req.user = sessionData.user;
                req.session = sessionData.session;
                next();
            }
            catch (error) {
                return this.handleUnauthorized(res, 'Authentication error');
            }
        };
    }
    getSessionFromRequest(req) {
        // Try to get session token from various sources
        // 1. Authorization header (Bearer token)
        const authHeader = req.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        // 2. Cookie header
        const cookieHeader = req.headers?.cookie;
        if (cookieHeader) {
            return this.getSessionFromCookies(cookieHeader);
        }
        // 3. Query parameter (not recommended for production)
        if (req.query?.sessionToken) {
            return req.query.sessionToken;
        }
        return null;
    }
    handleUnauthorized(res, message) {
        if (res.status && res.json) {
            // Express-style response
            return res.status(401).json({ error: message });
        }
        else if (res.respond) {
            // Next.js API response
            return res.respond(401, { error: message });
        }
        else {
            // Generic response
            res.statusCode = 401;
            res.end(JSON.stringify({ error: message }));
        }
    }
    /**
     * Create a higher-order function for protecting route handlers
     */
    withAuth(handler) {
        return (async (...args) => {
            this.ensureInitialized();
            const [req, res] = args;
            try {
                const sessionToken = this.getSessionFromRequest(req);
                if (!sessionToken) {
                    return this.handleUnauthorized(res, 'No session token provided');
                }
                const sessionData = await this.getSession(sessionToken);
                if (!sessionData) {
                    return this.handleUnauthorized(res, 'Invalid or expired session');
                }
                // Attach user to request object
                req.user = sessionData.user;
                req.session = sessionData.session;
                return await handler(...args);
            }
            catch (error) {
                return this.handleUnauthorized(res, 'Authentication error');
            }
        });
    }
}

export { AccountSchema, AuthConfigSchema, AuthEngine, AuthError, ConfigError, Database, DatabaseError, EasyAuth, OAuthManager, PasswordAuth, SessionManager, SessionSchema, UserSchema, ValidationError, generateId, hashPassword, schema, verifyPassword };
