import { Server, Vector } from "./../Minecraft.js";
export function addTickingArea(start, end, dimension, name, preload = false) {
    return Server.runCommand(`tickingarea add ${Vector.from(start).print()} ${Vector.from(end).print()} ${name} ${preload}`, dimension).error;
}
export function removeTickingArea(name, dimension) {
    return Server.runCommand(`tickingarea remove ${name}`, dimension).error;
}
