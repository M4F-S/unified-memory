function _applyDecoratedDescriptor(i, e, r, n, l) {
  var a = {};
  return Object.keys(n).forEach(function (i) {
    a[i] = n[i];
  }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) {
    return n(i, e, r) || r;
  }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a;
}

// make PromiseIndex a nominal typing
var PromiseIndexBrand;
(function (PromiseIndexBrand) {
  PromiseIndexBrand[PromiseIndexBrand["_"] = -1] = "_";
})(PromiseIndexBrand || (PromiseIndexBrand = {}));
const TYPE_KEY = "typeInfo";
var TypeBrand;
(function (TypeBrand) {
  TypeBrand["BIGINT"] = "bigint";
  TypeBrand["DATE"] = "date";
})(TypeBrand || (TypeBrand = {}));
function serialize(valueToSerialize) {
  return encode(JSON.stringify(valueToSerialize, function (key, value) {
    if (typeof value === "bigint") {
      return {
        value: value.toString(),
        [TYPE_KEY]: TypeBrand.BIGINT
      };
    }
    if (typeof this[key] === "object" && this[key] !== null && this[key] instanceof Date) {
      return {
        value: this[key].toISOString(),
        [TYPE_KEY]: TypeBrand.DATE
      };
    }
    return value;
  }));
}
function deserialize(valueToDeserialize) {
  return JSON.parse(decode(valueToDeserialize), (_, value) => {
    if (value !== null && typeof value === "object" && Object.keys(value).length === 2 && Object.keys(value).every(key => ["value", TYPE_KEY].includes(key))) {
      switch (value[TYPE_KEY]) {
        case TypeBrand.BIGINT:
          return BigInt(value["value"]);
        case TypeBrand.DATE:
          return new Date(value["value"]);
      }
    }
    return value;
  });
}
/**
 * Convert a string to Uint8Array, each character must have a char code between 0-255.
 * @param s - string that with only Latin1 character to convert
 * @returns result Uint8Array
 */
function bytes(s) {
  return env.latin1_string_to_uint8array(s);
}
/**
 * Convert a Uint8Array to string, each uint8 to the single character of that char code
 * @param a - Uint8Array to convert
 * @returns result string
 */
function str(a) {
  return env.uint8array_to_latin1_string(a);
}
/**
 * Encode the string to Uint8Array with UTF-8 encoding
 * @param s - String to encode
 * @returns result Uint8Array
 */
function encode(s) {
  return env.utf8_string_to_uint8array(s);
}
/**
 * Decode the Uint8Array to string in UTF-8 encoding
 * @param a - array to decode
 * @returns result string
 */
function decode(a) {
  return env.uint8array_to_utf8_string(a);
}

var CurveType;
(function (CurveType) {
  CurveType[CurveType["ED25519"] = 0] = "ED25519";
  CurveType[CurveType["SECP256K1"] = 1] = "SECP256K1";
})(CurveType || (CurveType = {}));
var DataLength;
(function (DataLength) {
  DataLength[DataLength["ED25519"] = 32] = "ED25519";
  DataLength[DataLength["SECP256K1"] = 64] = "SECP256K1";
})(DataLength || (DataLength = {}));

/**
 * A Promise result in near can be one of:
 * - NotReady = 0 - the promise you are specifying is still not ready, not yet failed nor successful.
 * - Successful = 1 - the promise has been successfully executed and you can retrieve the resulting value.
 * - Failed = 2 - the promise execution has failed.
 */
var PromiseResult;
(function (PromiseResult) {
  PromiseResult[PromiseResult["NotReady"] = 0] = "NotReady";
  PromiseResult[PromiseResult["Successful"] = 1] = "Successful";
  PromiseResult[PromiseResult["Failed"] = 2] = "Failed";
})(PromiseResult || (PromiseResult = {}));
/**
 * A promise error can either be due to the promise failing or not yet being ready.
 */
var PromiseError;
(function (PromiseError) {
  PromiseError[PromiseError["Failed"] = 0] = "Failed";
  PromiseError[PromiseError["NotReady"] = 1] = "NotReady";
})(PromiseError || (PromiseError = {}));

const U64_MAX = 2n ** 64n - 1n;
const EVICTED_REGISTER = U64_MAX - 1n;
/**
 * Logs parameters in the NEAR WASM virtual machine.
 *
 * @param params - Parameters to log.
 */
function log(...params) {
  env.log(params.reduce((accumulated, parameter, index) => {
    // Stringify undefined
    const param = parameter === undefined ? "undefined" : parameter;
    // Convert Objects to strings and convert to string
    const stringified = typeof param === "object" ? JSON.stringify(param) : `${param}`;
    if (index === 0) {
      return stringified;
    }
    return `${accumulated} ${stringified}`;
  }, ""));
}
/**
 * Returns the account ID of the account that called the function.
 * Can only be called in a call or initialize function.
 */
function predecessorAccountId() {
  env.predecessor_account_id(0);
  return str(env.read_register(0));
}
/**
 * Returns the account ID of the current contract - the contract that is being executed.
 */
function currentAccountId() {
  env.current_account_id(0);
  return str(env.read_register(0));
}
/**
 * Returns the current block timestamp.
 */
function blockTimestamp() {
  return env.block_timestamp();
}
/**
 * Returns the amount of NEAR attached to this function call.
 * Can only be called in payable functions.
 */
function attachedDeposit() {
  return env.attached_deposit();
}
/**
 * Reads the value from NEAR storage that is stored under the provided key.
 *
 * @param key - The key to read from storage.
 */
function storageReadRaw(key) {
  const returnValue = env.storage_read(key, 0);
  if (returnValue !== 1n) {
    return null;
  }
  return env.read_register(0);
}
/**
 * Writes the provided bytes to NEAR storage under the provided key.
 *
 * @param key - The key under which to store the value.
 * @param value - The value to store.
 */
function storageWriteRaw(key, value) {
  return env.storage_write(key, value, EVICTED_REGISTER) === 1n;
}
/**
 * Returns the arguments passed to the current smart contract call.
 */
function inputRaw() {
  env.input(0);
  return env.read_register(0);
}
/**
 * Returns the arguments passed to the current smart contract call as utf-8 string.
 */
function input() {
  return decode(inputRaw());
}

/**
 * Tells the SDK to use this function as the initialization function of the contract.
 *
 * @param _empty - An empty object.
 */
function initialize(_empty) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, _descriptor
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) {};
}
/**
 * Tells the SDK to expose this function as a view function.
 *
 * @param _empty - An empty object.
 */
function view(_empty) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, _descriptor
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) {};
}
function call({
  privateFunction = false,
  payableFunction = false
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, descriptor) {
    const originalMethod = descriptor.value;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    descriptor.value = function (...args) {
      if (privateFunction && predecessorAccountId() !== currentAccountId()) {
        throw new Error("Function is private");
      }
      if (!payableFunction && attachedDeposit() > 0n) {
        throw new Error("Function is not payable");
      }
      return originalMethod.apply(this, args);
    };
  };
}
function NearBindgen({
  requireInit = false,
  serializer = serialize,
  deserializer = deserialize
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return target => {
    return class extends target {
      static _create() {
        return new target();
      }
      static _getState() {
        const rawState = storageReadRaw(bytes("STATE"));
        return rawState ? this._deserialize(rawState) : null;
      }
      static _saveToStorage(objectToSave) {
        storageWriteRaw(bytes("STATE"), this._serialize(objectToSave));
      }
      static _getArgs() {
        return JSON.parse(input() || "{}");
      }
      static _serialize(value, forReturn = false) {
        if (forReturn) {
          return encode(JSON.stringify(value, (_, value) => typeof value === "bigint" ? `${value}` : value));
        }
        return serializer(value);
      }
      static _deserialize(value) {
        return deserializer(value);
      }
      static _reconstruct(classObject, plainObject) {
        for (const item in classObject) {
          const reconstructor = classObject[item].constructor?.reconstruct;
          classObject[item] = reconstructor ? reconstructor(plainObject[item]) : plainObject[item];
        }
        return classObject;
      }
      static _requireInit() {
        return requireInit;
      }
    };
  };
}

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2;
let ConsentNFT = (_dec = NearBindgen({}), _dec2 = initialize(), _dec3 = call({
  payableFunction: true
}), _dec4 = call({}), _dec5 = view(), _dec6 = call({}), _dec7 = view(), _dec8 = view(), _dec(_class = (_class2 = class ConsentNFT {
  constructor() {
    this.consents = {};
    this.nextTokenId = 0;
  }
  init({
    owner_id
  }) {
    this.owner = owner_id;
  }
  mint_consent({
    agent_id,
    allowed_platforms,
    allowed_memory_types,
    max_queries,
    max_usdc_budget,
    expires_at,
    data_root_hash
  }) {
    const caller = predecessorAccountId();
    const tokenId = (this.nextTokenId++).toString();
    this.consents[tokenId] = {
      owner: caller,
      agent_id,
      allowed_platforms,
      allowed_memory_types,
      max_queries,
      max_usdc_budget,
      usdc_spent: 0,
      queries_used: 0,
      expires_at,
      data_root_hash,
      is_active: true,
      created_at: blockTimestamp().toString(),
      revoked_at: null
    };
    log(`ConsentNFT minted: tokenId=${tokenId} agent=${agent_id}`);
    return tokenId;
  }
  revoke_consent({
    token_id
  }) {
    const caller = predecessorAccountId();
    const consent = this.consents[token_id];
    if (!consent) throw new Error('Token not found');
    if (consent.owner !== caller) throw new Error('Not owner');
    if (!consent.is_active) throw new Error('Already revoked');
    consent.is_active = false;
    consent.revoked_at = blockTimestamp().toString();
    this.consents[token_id] = consent;
    log(`ConsentNFT revoked: tokenId=${token_id}`);
  }
  validate_query({
    token_id,
    platform,
    memory_type,
    query_cost_usdc
  }) {
    const c = this.consents[token_id];
    if (!c) return {
      valid: false,
      reason: 'Token not found'
    };
    if (!c.is_active) return {
      valid: false,
      reason: 'Consent revoked'
    };
    if (BigInt(blockTimestamp()) > BigInt(c.expires_at) * 1000000n) return {
      valid: false,
      reason: 'Consent expired'
    };
    if (platform !== 'all' && !c.allowed_platforms.includes(platform)) return {
      valid: false,
      reason: 'Platform not in scope'
    };
    if (memory_type !== 'all' && !c.allowed_memory_types.includes(memory_type)) return {
      valid: false,
      reason: 'Memory type not in scope'
    };
    if (c.queries_used >= c.max_queries) return {
      valid: false,
      reason: 'Query limit reached'
    };
    if (c.usdc_spent + query_cost_usdc > c.max_usdc_budget) return {
      valid: false,
      reason: 'Budget exceeded'
    };
    return {
      valid: true,
      remaining_queries: c.max_queries - c.queries_used
    };
  }
  record_query({
    token_id,
    usdc_spent
  }) {
    const c = this.consents[token_id];
    if (!c) throw new Error('Token not found');
    c.queries_used += 1;
    c.usdc_spent += usdc_spent;
    this.consents[token_id] = c;
  }
  get_consent({
    token_id
  }) {
    return this.consents[token_id] || null;
  }
  get_consents_by_owner({
    owner_id
  }) {
    return Object.entries(this.consents).filter(([_, c]) => c.owner === owner_id).map(([id, c]) => ({
      token_id: id,
      ...c
    }));
  }
}, _applyDecoratedDescriptor(_class2.prototype, "init", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "init"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "mint_consent", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "mint_consent"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "revoke_consent", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "revoke_consent"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "validate_query", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "validate_query"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "record_query", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "record_query"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_consent", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "get_consent"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_consents_by_owner", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "get_consents_by_owner"), _class2.prototype), _class2)) || _class);
function get_consents_by_owner() {
  const _state = ConsentNFT._getState();
  if (!_state && ConsentNFT._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = ConsentNFT._create();
  if (_state) {
    ConsentNFT._reconstruct(_contract, _state);
  }
  const _args = ConsentNFT._getArgs();
  const _result = _contract.get_consents_by_owner(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(ConsentNFT._serialize(_result, true));
}
function get_consent() {
  const _state = ConsentNFT._getState();
  if (!_state && ConsentNFT._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = ConsentNFT._create();
  if (_state) {
    ConsentNFT._reconstruct(_contract, _state);
  }
  const _args = ConsentNFT._getArgs();
  const _result = _contract.get_consent(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(ConsentNFT._serialize(_result, true));
}
function record_query() {
  const _state = ConsentNFT._getState();
  if (!_state && ConsentNFT._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = ConsentNFT._create();
  if (_state) {
    ConsentNFT._reconstruct(_contract, _state);
  }
  const _args = ConsentNFT._getArgs();
  const _result = _contract.record_query(_args);
  ConsentNFT._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(ConsentNFT._serialize(_result, true));
}
function validate_query() {
  const _state = ConsentNFT._getState();
  if (!_state && ConsentNFT._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = ConsentNFT._create();
  if (_state) {
    ConsentNFT._reconstruct(_contract, _state);
  }
  const _args = ConsentNFT._getArgs();
  const _result = _contract.validate_query(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(ConsentNFT._serialize(_result, true));
}
function revoke_consent() {
  const _state = ConsentNFT._getState();
  if (!_state && ConsentNFT._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = ConsentNFT._create();
  if (_state) {
    ConsentNFT._reconstruct(_contract, _state);
  }
  const _args = ConsentNFT._getArgs();
  const _result = _contract.revoke_consent(_args);
  ConsentNFT._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(ConsentNFT._serialize(_result, true));
}
function mint_consent() {
  const _state = ConsentNFT._getState();
  if (!_state && ConsentNFT._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = ConsentNFT._create();
  if (_state) {
    ConsentNFT._reconstruct(_contract, _state);
  }
  const _args = ConsentNFT._getArgs();
  const _result = _contract.mint_consent(_args);
  ConsentNFT._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(ConsentNFT._serialize(_result, true));
}
function init() {
  const _state = ConsentNFT._getState();
  if (_state) {
    throw new Error("Contract already initialized");
  }
  const _contract = ConsentNFT._create();
  const _args = ConsentNFT._getArgs();
  const _result = _contract.init(_args);
  ConsentNFT._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(ConsentNFT._serialize(_result, true));
}

export { get_consent, get_consents_by_owner, init, mint_consent, record_query, revoke_consent, validate_query };
//# sourceMappingURL=consent_nft.js.map
