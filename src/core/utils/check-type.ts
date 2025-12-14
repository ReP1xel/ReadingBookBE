export class CheckType {
  //General predicates
  static equal(thing: any, thang: any): boolean {
    return thing === thang;
  }

  static isNull(thing: any): boolean {
    return thing === null;
  }

  static isUndefined(thing: any): boolean {
    return thing === undefined;
  }

  static assigned(thing: any): boolean {
    return thing !== null && thing !== undefined;
  }

  static primitive(thing: any): boolean {
    return (
      thing === null ||
      thing === undefined ||
      typeof thing === 'boolean' ||
      typeof thing === 'number' ||
      typeof thing === 'string' ||
      typeof thing === 'symbol'
    );
  }

  static hasLength(thing: any, value: number): boolean {
    return thing?.length === value;
  }

  //String predicates
  static isString(thing: any): boolean {
    return typeof thing === 'string';
  }

  static emptyString(thing: any): boolean {
    return thing === '';
  }

  static nonEmptyString(thing: any): boolean {
    return typeof thing === 'string' && thing.length > 0;
  }

  static match(string: string, regex: RegExp): boolean {
    return regex.test(string);
  }

  //Number predicates
  static isNumber(thing: any): boolean {
    return typeof thing === 'number' && !isNaN(thing) && isFinite(thing);
  }

  static isInteger(thing: any): boolean {
    return Number.isInteger(thing);
  }

  static isFloat(thing: any): boolean {
    return typeof thing === 'number' && !Number.isInteger(thing);
  }

  static isZero(thing: number): boolean {
    return thing === 0;
  }

  static isPositive(thing: number): boolean {
    return thing > 0;
  }

  static isNegative(thing: number): boolean {
    return thing < 0;
  }

  static isOdd(thing: number): boolean {
    return thing % 2 !== 0;
  }

  static isEven(thing: number): boolean {
    return thing % 2 === 0;
  }

  static greater(thing: number, value: number): boolean {
    return thing > value;
  }

  static greaterOrEqual(thing: number, value: number): boolean {
    return thing >= value;
  }

  static less(thing: number, value: number): boolean {
    return thing < value;
  }

  static lessOrEqual(thing: number, value: number): boolean {
    return thing <= value;
  }

  static between(thing: number, a: number, b: number): boolean {
    return thing > Math.min(a, b) && thing < Math.max(a, b);
  }

  static inRange(thing: number, a: number, b: number): boolean {
    return thing >= Math.min(a, b) && thing <= Math.max(a, b);
  }

  //Boolean predicates
  static isBoolean(thing: any): boolean {
    return typeof thing === 'boolean';
  }

  //Object predicates
  static isObject(thing: any): boolean {
    return typeof thing === 'object' && thing !== null && !Array.isArray(thing);
  }

  static emptyObject(thing: any): boolean {
    return this.isObject(thing) && Object.keys(thing).length === 0;
  }

  static nonEmptyObject(thing: any): boolean {
    return this.isObject(thing) && Object.keys(thing).length > 0;
  }

  static contains(object: object, value: any): boolean {
    return Object.values(object).includes(value);
  }

  static containsKey(object: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  //Array predicates
  static isArray(thing: any): boolean {
    return Array.isArray(thing);
  }

  static emptyArray(thing: any): boolean {
    return this.isArray(thing) && thing.length === 0;
  }

  static nonEmptyArray(thing: any): boolean {
    return this.isArray(thing) && thing.length > 0;
  }

  static containsArray(array: any[], value: any): boolean {
    return array.includes(value);
  }

  //Date predicates
  static isDate(thing: any): boolean {
    return thing instanceof Date && !isNaN(thing.getTime());
  }

  //Function predicates
  static isFunction(thing: any): boolean {
    return typeof thing === 'function';
  }

  //Modifiers
  static not(value: any): boolean {
    return !value;
  }

  static maybe(value: any): boolean {
    return value === null || value === undefined ? true : value;
  }

  static assert(value: any, message = 'Assertion failed'): any {
    if (!value) {
      throw new Error(message);
    }
    return value;
  }

  //Batch operations
  static map(things: any[], predicate: (value: any) => boolean): boolean[] {
    return things.map(predicate);
  }

  static all(results: boolean[]): boolean {
    return results.every(Boolean);
  }

  static any(results: boolean[]): boolean {
    return results.some(Boolean);
  }

  //Check resp status
  static isSuccess(status: any): any {
    return status === 200 || status === 201;
  }
}
