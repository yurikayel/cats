export class ServiceContainer {
  constructor() {
    this.factories = new Map();
    this.instances = new Map();
  }

  register(key, factory) {
    if (this.factories.has(key)) {
      throw new Error(`Service "${key}" is already registered.`);
    }

    if (typeof factory !== "function") {
      throw new TypeError(`Factory for service "${key}" must be a function.`);
    }

    this.factories.set(key, factory);
  }

  get(key) {
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }

    const factory = this.factories.get(key);

    if (!factory) {
      throw new Error(`Missing service registration for "${key}".`);
    }

    const instance = factory(this);
    this.instances.set(key, instance);
    return instance;
  }

  has(key) {
    return this.factories.has(key);
  }
}

export function createServiceContainer() {
  return new ServiceContainer();
}
