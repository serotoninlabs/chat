import {
  IDBPDatabase,
  DBSchema,
  openDB,
  StoreNames,
  StoreKey,
  StoreValue,
} from "idb";

import { v4 as uuid } from "uuid";

export interface StoreConfig {
  indexes: string[];
}

export abstract class StorageFactory<Schema extends DBSchema> {
  public abstract version: number;
  public abstract namespace: string;
  public abstract databaseName: string;
  public abstract migrations: {
    [key: number]: (db: IDBPDatabase<Schema>) => void;
  };
  protected db!: IDBPDatabase<Schema>;
  private keySubscriptions: {
    [storeAndKey: string]: {
      [subscriptionId: string]: (key: any, value: any) => void;
    };
  } = {};
  private storeSubscriptions: {
    [storeName in StoreNames<Schema>]?: {
      [subscriptionId: string]: {
        test(key: any, value: any): boolean;
        cb(key: any, value: any): void;
      };
    };
  } = {};

  public async initialize(): Promise<void> {
    const name = `${this.namespace}/${this.databaseName}`;
    const version = this.version;
    this.db = await openDB<Schema>(name, version, {
      upgrade: (db) => {
        const currentVersion = db.version;
        if (currentVersion <= this.version) {
          for (let i = currentVersion; i <= this.version; i++) {
            console.log("running database migration ", i);
            this.migrations[i](db);
          }
        }
      },
    });
  }

  public async store<Name extends StoreNames<Schema>>(
    store: Name,
    key: StoreKey<Schema, Name>,
    value: StoreValue<Schema, Name>,
    throwIfExists?: boolean
  ): Promise<void> {
    if (throwIfExists) {
      await this.db.add(store, value, key);
    } else {
      await this.db.put(store, value, key);
    }

    if (typeof key !== "string" && typeof key !== "number") {
      // TODO(dankins): figure out a way to serialize this
      console.warn(
        "key is not a string or a number, so subscriptions might not work",
        key
      );
    }
    const keySubscriptions = this.keySubscriptions[`${store}|${key}`];
    if (keySubscriptions) {
      for (const subscriptionId in keySubscriptions) {
        keySubscriptions[subscriptionId](key, value);
      }
    }

    const storeSubscriptions = this.storeSubscriptions[store];
    if (storeSubscriptions) {
      for (const subscriptionId in storeSubscriptions) {
        const sub = storeSubscriptions[subscriptionId];
        // only call callback if it matches the test expression
        sub.test(key, value) && sub.cb(key, value);
      }
    }
  }

  public async subscribeToKey<Name extends StoreNames<Schema>>(
    store: Name,
    key: StoreKey<Schema, Name>,
    cb: (key: StoreKey<Schema, Name>, value: StoreValue<Schema, Name>) => void
  ) {
    let subscriptions = this.keySubscriptions[`${store}|${key}`];
    if (!subscriptions) {
      subscriptions = {};
      this.keySubscriptions[`${store}|${key}`] = subscriptions;
    }
    const id = uuid();
    subscriptions[id] = cb;

    return id;
  }

  public unsubscribeFromKey<Name extends StoreNames<Schema>>(
    store: Name,
    key: StoreKey<Schema, Name>,
    id: string
  ) {
    let subscriptions = this.keySubscriptions[`${store}|${key}`];
    if (!subscriptions) {
      return;
    }
    delete subscriptions[id];
  }

  public subscribeToStore<Name extends StoreNames<Schema>>(
    store: Name,
    test: (
      key: StoreKey<Schema, Name>,
      value: StoreValue<Schema, Name>
    ) => boolean,
    cb: (key: StoreKey<Schema, Name>, value: StoreValue<Schema, Name>) => void
  ): string {
    let storeSubscriptions = this.storeSubscriptions[store];
    if (!storeSubscriptions) {
      storeSubscriptions = {};
      this.storeSubscriptions[store] = storeSubscriptions;
    }
    const id = uuid();
    storeSubscriptions[id] = { test, cb };

    return id;
  }
  public async unsubscribeFromStore<Name extends StoreNames<Schema>>(
    store: Name,
    id: string
  ) {
    let storeSubscriptions = this.storeSubscriptions[store];
    if (!storeSubscriptions) {
      return;
    }
    delete storeSubscriptions[id];
  }

  public async requestPersistentStorage(): Promise<boolean | undefined> {
    // Request persistent storage for site
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log(`Persisted storage granted: ${isPersisted}`);
      return isPersisted;
    }
  }
}
