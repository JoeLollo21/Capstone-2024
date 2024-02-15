/* eslint-disable @typescript-eslint/no-explicit-any */
import { world } from "@minecraft/server";
import { Server } from "./serverBuilder.js";
const objective = world.scoreboard.getObjective("GAMETEST_DB") ?? world.scoreboard.addObjective("GAMETEST_DB", "");
export class Database {
    constructor(name) {
        this.name = name;
        this.data = null;
        this.opened = false;
    }
    /**
    * Save a value or update a value in the Database under a key
    * @param {string} Key The key you want to save the value as
    * @param {any} value The value you want to save
    * @example Database.set('Test Key', 'Test Value');
    */
    set(key, value) {
        this.data[key] = value;
    }
    /**
    * Get the value of the key
    * @param {string} key
    * @returns {any}
    * @example Database.get('Test Key');
    */
    get(key) {
        return this.data[key];
    }
    /**
    * Check if the key exists in the table
    * @param {string} key
    * @returns {boolean}
    * @example Database.has('Test Key');
    */
    has(key) {
        return key in this.data;
    }
    /**
    * Delete the key from the table
    * @param {string} key
    * @returns {boolean}
    * @example Database.delete('Test Key');
    */
    delete(key) {
        delete this.data[key];
    }
    /**
    * Clear everything in the table
    * @example Database.clear()
    */
    clear() {
        this.data = {};
    }
    /**
     * Load the table from the scoreboard data.
     * @example Database.load()
     */
    load() {
        const table = this.getScoreboardParticipant();
        this.data = table ? JSON.parse(JSON.parse(`"${table.displayName}"`))[1] : {};
        this.opened = true;
    }
    /**
     * Save all changes to the scoreboard.
     * @example Database.save()
     */
    save() {
        const table = this.getScoreboardParticipant();
        if (table) {
            Server.runCommand(`scoreboard players reset "${table.displayName}" GAMETEST_DB`);
        }
        Server.runCommand(`scoreboard players add ${JSON.stringify(JSON.stringify([this.name, this.data]))} GAMETEST_DB 0`);
    }
    /**
    * Get all the keys in the table
    * @returns {Array<string>}
    * @example Database.keys();
    */
    keys() {
        return Object.keys(this.data);
    }
    /**
    * Get all the values in the table
    * @returns {Array<any>}
    * @example Database.values();
    */
    values() {
        return Object.values(this.data);
    }
    /**
    * Check if all the keys exists in the table
    * @param {string} keys
    * @returns {boolean}
    * @example Database.hasAll('Test Key', 'Test Key 2', 'Test Key 3');
    */
    hasAll(...keys) {
        return keys.every((k) => this.has(k));
    }
    /**
    * Check if any of the keys exists in the table
    * @param {string} keys
    * @returns {boolean}
    * @example Database.hasAny('Test Key', 'Test Key 2', 'Test Key 3');
    */
    hasAny(...keys) {
        return keys.some((k) => this.has(k));
    }
    getScoreboardParticipant() {
        for (const table of objective.getParticipants()) {
            const name = table.displayName;
            if (name.startsWith(`[\\"${this.name}\\"`)) {
                return table;
            }
        }
    }
}
