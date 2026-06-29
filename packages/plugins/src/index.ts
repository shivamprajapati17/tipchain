/**
 * @tipchain/plugins — Plugin Registry & Loader
 *
 * Manages the lifecycle of all installed plugins.
 * Plugins register with the registry and receive events
 * as they occur in the TipChain platform.
 *
 * @example
 * ```typescript
 * import { PluginRegistry } from "@tipchain/plugins";
 * import { NftRewardsPlugin } from "@tipchain/plugin-nft-rewards";
 *
 * const registry = new PluginRegistry({ db, logger });
 * registry.register(NftRewardsPlugin);
 * await registry.loadAll();
 * ```
 */

import type {
  TipChainPlugin,
  PluginContext,
  PluginEventName,
  PluginEventMap,
} from "./types";

// ─── Plugin Registry ────────────────────────────────────────────────────────

export class PluginRegistry {
  private plugins: Map<string, TipChainPlugin> = new Map();
  private contexts: Map<string, PluginContext> = new Map();
  private loaded = false;

  constructor(
    private options: {
      db?: any;
      logger?: Partial<PluginContext["logger"]>;
    } = {}
  ) {}

  /** Register a plugin with the registry */
  register(plugin: TipChainPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  /** Unregister a plugin */
  unregister(name: string): boolean {
    return this.plugins.delete(name);
  }

  /** Check if a plugin is registered */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /** Get a registered plugin by name */
  get(name: string): TipChainPlugin | undefined {
    return this.plugins.get(name);
  }

  /** List all registered plugins */
  list(): TipChainPlugin[] {
    return Array.from(this.plugins.values());
  }

  /** Load all registered plugins (calls onLoad) */
  async loadAll(): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      const context: PluginContext = {
        config: {},
        db: this.options.db,
        logger: {
          info: (msg, meta) =>
            console.log(`[plugin:${name}] ${msg}`, meta ?? ""),
          warn: (msg, meta) =>
            console.warn(`[plugin:${name}] ${msg}`, meta ?? ""),
          error: (msg, meta) =>
            console.error(`[plugin:${name}] ${msg}`, meta ?? ""),
          ...this.options.logger,
        },
        on: (event, handler) => {
          // Store event handler for later dispatch
          const key = `${name}:${event}` as const;
          this.eventHandlers.set(key, handler);
        },
        fetch: globalThis.fetch.bind(globalThis),
      };

      this.contexts.set(name, context);

      if (plugin.onLoad) {
        try {
          await plugin.onLoad(context);
          context.logger.info("Plugin loaded");
        } catch (err) {
          context.logger.error(
            `Failed to load: ${err instanceof Error ? err.message : err}`
          );
        }
      }
    }

    this.loaded = true;
  }

  /** Unload all plugins (calls onUnload) */
  async unloadAll(): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      if (plugin.onUnload) {
        try {
          await plugin.onUnload();
        } catch (err) {
          console.error(`[plugin:${name}] Unload error:`, err);
        }
      }
    }

    this.plugins.clear();
    this.contexts.clear();
    this.loaded = false;
  }

  /** Dispatch an event to all registered plugins */
  async emit<K extends PluginEventName>(
    event: K,
    data: PluginEventMap[K]
  ): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      try {
        switch (event) {
          case "tip.received":
            await plugin.onTipReceived?.(data as any);
            break;
          case "creator.created":
            await plugin.onCreatorCreated?.(data as any);
            break;
          case "membership.activated":
            await plugin.onMembershipActivated?.(data as any);
            break;
          case "badge.awarded":
            await plugin.onBadgeAwarded?.(data as any);
            break;
        }
      } catch (err) {
        console.error(
          `[plugin:${name}] Error handling event "${event}":`,
          err
        );
      }
    }
  }

  /** Get all registered React components from plugins */
  getComponents(): Record<string, React.ComponentType<any>> {
    const allComponents: Record<string, React.ComponentType<any>> = {};
    for (const plugin of this.plugins.values()) {
      if (plugin.components) {
        Object.assign(allComponents, plugin.components);
      }
    }
    return allComponents;
  }

  /** Get all registered API routers from plugins */
  get apiRouters(): Router[] {
    const routers: Router[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.apiRoutes) {
        routers.push(plugin.apiRoutes);
      }
    }
    return routers;
  }

  // ── Internal ──────────────────────────────────────────────────────────
  private eventHandlers: Map<string, Function> = new Map();
}

// ─── Re-exports ─────────────────────────────────────────────────────────────

export type { TipChainPlugin, PluginContext, PluginEventMap, PluginEventName } from "./types";
export type { TipEvent, CreatorEvent, MembershipEvent, BadgeEvent } from "./types";
