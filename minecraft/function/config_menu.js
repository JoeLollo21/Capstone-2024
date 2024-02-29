import { HotbarUI } from "./../modules/hotbar_ui.js";
import { Mask } from "./../modules/mask.js";
import { Pattern } from "./../modules/pattern.js";
import { contentLog, Server } from "./../../library/Minecraft.js";
import { SphereBrush } from "../brushes/sphere_brush.js";
import { CylinderBrush } from "../brushes/cylinder_brush.js";
import { SmoothBrush } from "../brushes/smooth_brush.js";
import { Tools } from "../tools/tool_manager.js";
import { selectionModes } from "./../modules/selection.js";
import config from "config.js";
import { StructureBrush } from "server/brushes/structure_brush.js";
import { getSession } from "server/sessions.js";
import { ErosionBrush } from "server/brushes/erosion_brush.js";
import { OverlayBrush } from "server/brushes/overlay_brush.js";
const toolsWithProperties = [];
const usePickerInput = {
    $usePicker: {
        type: "toggle",
        name: "%worldedit.config.usePicker",
        default: (ctx, player) => getToolProperty(ctx, player, "mask")?.getSource() == "(picked)"
    }
};
const brushSizeInput = {
    $size: {
        type: "slider",
        name: "%worldedit.config.radius",
        min: 1, max: config.maxBrushRadius,
        default: (ctx, player) => ctx.getData("creatingTool") ? 3 : getToolProperty(ctx, player, "brush").getSize()
    }
};
const maskInput = {
    $mask: {
        type: "textField",
        name: "%worldedit.config.mask",
        placeholder: "Eg: air %gametest.optionalPrefix",
        default: (ctx, player) => {
            if (ctx.getData("creatingTool"))
                return "";
            return getToolProperty(ctx, player, "mask")?.getSource() ?? "";
        }
    }
};
const brushPatternInput = {
    $pattern: {
        type: "textField",
        name: "%worldedit.config.pattern",
        placeholder: "Eg: stone,dirt",
        default: (ctx, player) => {
            if (ctx.getData("creatingTool"))
                return "";
            return getToolProperty(ctx, player, "brush").getPattern().getSource();
        }
    }
};
function displayItem(item) {
    let result = item;
    if (result.startsWith("minecraft:")) {
        result = result.slice("minecraft:".length);
    }
    return result;
}
function editToolTitle(ctx) {
    return "%accessibility.textbox.editing : " + displayItem(ctx.getData("currentItem"));
}
function getToolProperty(ctx, player, prop) {
    return Tools.getProperty(ctx.getData("currentItem"), player.id, prop);
}
function getTools(player, brushes) {
    return Tools.getBoundItems(player.id, brushes ? "brush" : /^.*(?<!brush)$/);
}
function getToolType(ctx, player) {
    return ctx.getData("creatingTool") ?? Tools.getBindingType(ctx.getData("currentItem"), player.id);
}
function finishToolEdit(ctx) {
    ctx.goto("$confirmToolBind");
}
Server.uiForms.register("$configMenu", {
    title: "%worldedit.config.mainMenu",
    buttons: [
        {
            text: "%worldedit.config.general",
            icon: "textures/ui/gear",
            action: ctx => ctx.goto("$generalOptions")
        },
        {
            text: "%worldedit.config.tools",
            icon: "textures/ui/tool_config",
            action: ctx => {
                ctx.setData("editingBrush", false);
                ctx.goto("$tools");
            }
        },
        {
            text: "%worldedit.config.brushes",
            icon: "textures/ui/brush_config",
            action: ctx => {
                ctx.setData("editingBrush", true);
                ctx.goto("$tools");
            }
        }
    ],
    cancel: () => null
});
Server.uiForms.register("$generalOptions", {
    title: "%worldedit.config.general",
    inputs: {
        $includeEntities: {
            name: "%worldedit.config.general.includeEntities",
            type: "toggle",
            default: ctx => ctx.getData("session").includeEntities
        },
        $includeAir: {
            name: "%worldedit.config.general.includeAir",
            type: "toggle",
            default: ctx => ctx.getData("session").includeAir
        },
        $perfMode: {
            name: "%worldedit.config.general.perfMode",
            type: "toggle",
            default: ctx => ctx.getData("session").performanceMode || config.performanceMode
        },
        $drawOutlines: {
            name: "%worldedit.config.general.drawOutlines",
            type: "toggle",
            default: ctx => ctx.getData("session").drawOutlines
        },
        $selectionMode: {
            name: "%worldedit.config.general.selectMode",
            type: "dropdown",
            options: [
                "%worldedit.selectionMode.cuboid",
                "%worldedit.selectionMode.extend",
                "%worldedit.selectionMode.sphere",
                "%worldedit.selectionMode.cylinder"
            ],
            default: ctx => selectionModes.indexOf(ctx.getData("session").selection.mode)
        }
    },
    submit: (ctx, _, input) => {
        const session = ctx.getData("session");
        session.includeAir = input.$includeAir;
        session.includeEntities = input.$includeEntities;
        session.performanceMode = input.$perfMode;
        session.drawOutlines = input.$drawOutlines;
        session.selection.mode = selectionModes[input.$selectionMode];
        ctx.returnto("$configMenu");
    },
    cancel: ctx => ctx.returnto("$configMenu")
});
Server.uiForms.register("$tools", {
    title: ctx => "%worldedit.config." + (ctx.getData("editingBrush") ? "brushes" : "tools"),
    buttons: (ctx, player) => {
        const buttons = [];
        for (const tool of getTools(player, ctx.getData("editingBrush"))) {
            const toolType = Tools.getBindingType(tool, player.id);
            buttons.push({
                text: displayItem(tool),
                action: (ctx) => {
                    ctx.setData("creatingTool", null);
                    ctx.setData("currentItem", tool);
                    if (toolsWithProperties.includes(toolType)) {
                        ctx.goto(`$editTool_${toolType}`);
                    }
                    else if (toolType == "brush") {
                        ctx.goto(`$editTool_${Tools.getProperty(tool, player.id, "brush").id}`);
                    }
                    else {
                        ctx.goto("$toolNoConfig");
                    }
                }
            });
        }
        buttons.push({
            text: (ctx) => "%worldedit.config.new" + (ctx.getData("editingBrush") ? "Brush" : "Tool"),
            action: (ctx, player) => {
                HotbarUI.goto("$chooseItem", player, ctx);
            }
        });
        if (buttons.length > 1) {
            buttons.push({
                text: "Delete tool(s)",
                action: (ctx) => {
                    ctx.goto("$deleteTools");
                }
            });
        }
        return buttons;
    },
    cancel: ctx => ctx.returnto("$configMenu")
});
Server.uiForms.register("$toolNoConfig", {
    title: "%worldedit.config.tool.noProps",
    message: "%worldedit.config.tool.noProps.detail " + "\n\n\n",
    buttons: [
        {
            text: "%dr.button.ok",
            action: ctx => ctx.returnto("$tools")
        }
    ],
    cancel: ctx => ctx.returnto("$tools")
});
Server.uiForms.register("$editTool_stacker_wand", {
    title: editToolTitle,
    inputs: {
        $range: {
            type: "slider",
            name: "%worldedit.config.range",
            min: 1, max: config.traceDistance,
            default: (ctx, player) => ctx.getData("creatingTool") ? 5 : getToolProperty(ctx, player, "range"),
        },
        ...maskInput,
        ...usePickerInput
    },
    submit: (ctx, player, input) => {
        if (input.$usePicker) {
            ctx.setData("pickerData", {
                return: "$editTool_stacker_wand",
                onFinish: (ctx, _, mask) => {
                    ctx.setData("toolData", [input.$range, mask]);
                    finishToolEdit(ctx);
                }
            });
            HotbarUI.goto("$pickMask", player, ctx);
        }
        else {
            ctx.setData("toolData", [input.$range, new Mask(input.$mask)]);
            finishToolEdit(ctx);
        }
    },
    cancel: ctx => ctx.returnto("$tools")
});
toolsWithProperties.push("stacker_wand");
Server.uiForms.register("$editTool_command_wand", {
    title: editToolTitle,
    inputs: {
        $command: {
            type: "textField",
            name: "%worldedit.config.command",
            placeholder: "Enter here (without ; or /)",
            default: (ctx, player) => ctx.getData("creatingTool") ? "" : getToolProperty(ctx, player, "command")
        },
        $worldeditCmd: {
            type: "toggle",
            name: "%worldedit.config.command.isWorldEdit",
            default: (ctx, player) => ctx.getData("creatingTool") ? false : getToolProperty(ctx, player, "isCustom")
        }
    },
    submit: (ctx, _, input) => {
        ctx.setData("toolData", [(input.$worldeditCmd ? config.commandPrefix : "/") + input.$command]);
        finishToolEdit(ctx);
    },
    cancel: ctx => ctx.returnto("$tools")
});
toolsWithProperties.push("command_wand");
Server.uiForms.register("$editTool_replacer_wand", {
    title: editToolTitle,
    inputs: {
        $pattern: {
            type: "textField",
            name: "%worldedit.config.pattern",
            placeholder: "Eg: stone,dirt",
            default: (ctx, player) => {
                if (ctx.getData("creatingTool"))
                    return "";
                return getToolProperty(ctx, player, "pattern").getSource();
            }
        },
        ...usePickerInput
    },
    submit: (ctx, player, input) => {
        if (input.$usePicker) {
            ctx.setData("pickerData", {
                return: "$editTool_replacer_wand",
                onFinish: (ctx, _, _mask, pattern) => {
                    ctx.setData("toolData", [pattern]);
                    finishToolEdit(ctx);
                }
            });
            HotbarUI.goto("$pickPattern", player, ctx);
        }
        else {
            ctx.setData("toolData", [new Pattern(input.$pattern)]);
            finishToolEdit(ctx);
        }
    },
    cancel: ctx => ctx.returnto("$tools")
});
toolsWithProperties.push("replacer_wand");
Server.uiForms.register("$editTool_sphere_brush", {
    title: editToolTitle,
    inputs: {
        ...brushSizeInput,
        ...brushPatternInput,
        ...maskInput,
        $hollow: {
            type: "toggle",
            name: "%worldedit.config.hollow",
            default: (ctx, player) => !ctx.getData("creatingTool") ?
                getToolProperty(ctx, player, "brush").isHollow() :
                false
        },
        ...usePickerInput
    },
    submit: (ctx, player, input) => {
        if (input.$usePicker) {
            ctx.setData("pickerData", {
                return: "$editTool_sphere_brush",
                onFinish: (ctx, _, mask, pattern) => {
                    ctx.setData("toolData", [
                        new SphereBrush(input.$size, pattern, input.$hollow),
                        mask, null, null
                    ]);
                    finishToolEdit(ctx);
                }
            });
            HotbarUI.goto("$pickPatternMask", player, ctx);
        }
        else {
            contentLog.debug(input.$size, input.$pattern, input.$hollow);
            ctx.setData("toolData", [
                new SphereBrush(input.$size, new Pattern(input.$pattern), input.$hollow),
                new Mask(input.$mask), null, null
            ]);
            finishToolEdit(ctx);
        }
    },
    cancel: ctx => ctx.returnto("$tools")
});
Server.uiForms.register("$editTool_cylinder_brush", {
    title: editToolTitle,
    inputs: {
        ...brushSizeInput,
        $height: {
            type: "slider",
            name: "%worldedit.config.height",
            min: 1, max: config.maxBrushRadius * 2,
            default: (ctx, player) => ctx.getData("creatingTool") ? 1 : getToolProperty(ctx, player, "brush").getHeight()
        },
        ...brushPatternInput,
        ...maskInput,
        $hollow: {
            type: "toggle",
            name: "%worldedit.config.hollow",
            default: (ctx, player) => !ctx.getData("creatingTool") ?
                getToolProperty(ctx, player, "brush").isHollow() :
                false
        },
        ...usePickerInput
    },
    submit: (ctx, player, input) => {
        if (input.$usePicker) {
            ctx.setData("pickerData", {
                return: "$editTool_cylinder_brush",
                onFinish: (ctx, _, mask, pattern) => {
                    ctx.setData("toolData", [
                        new CylinderBrush(input.$size, input.$height, pattern, input.$hollow),
                        mask, null, null
                    ]);
                    finishToolEdit(ctx);
                }
            });
            HotbarUI.goto("$pickPatternMask", player, ctx);
        }
        else {
            ctx.setData("toolData", [
                new CylinderBrush(input.$size, input.$height, new Pattern(input.$pattern), input.$hollow),
                new Mask(input.$mask), null, null
            ]);
            finishToolEdit(ctx);
        }
    },
    cancel: ctx => ctx.returnto("$tools")
});
Server.uiForms.register("$editTool_smooth_brush", {
    title: editToolTitle,
    inputs: {
        ...brushSizeInput,
        ...maskInput,
        $iterations: {
            type: "slider",
            name: "%worldedit.config.smooth",
            min: 1, max: 6,
            default: (ctx, player) => ctx.getData("creatingTool") ? 1 : getToolProperty(ctx, player, "brush").getIterations()
        },
        $heightMask: {
            type: "textField",
            name: "%worldedit.config.mask.height",
            placeholder: "Eg: grass,stone %gametest.optionalPrefix",
            default: (ctx, player) => {
                if (ctx.getData("creatingTool"))
                    return "";
                return getToolProperty(ctx, player, "brush").getHeightMask()?.getSource() ?? "";
            }
        },
        ...usePickerInput
    },
    submit: (ctx, player, input) => {
        if (input.$usePicker) {
            ctx.setData("pickerData", {
                return: "$editTool_smooth_brush",
                onFinish: (ctx, _, mask) => {
                    ctx.setData("toolData", [
                        new SmoothBrush(input.$size, input.$iterations, new Mask(input.$heightMask)),
                        mask, null, null
                    ]);
                    finishToolEdit(ctx);
                }
            });
            HotbarUI.goto("$pickMask", player, ctx);
        }
        else {
            ctx.setData("toolData", [
                new SmoothBrush(input.$size, input.$iterations, new Mask(input.$heightMask)),
                new Mask(input.$mask), null, null
            ]);
            finishToolEdit(ctx);
        }
    },
    cancel: ctx => ctx.returnto("$tools")
});
Server.uiForms.register("$editTool_structure_brush", {
    title: editToolTitle,
    inputs: {
        $structs: {
            type: "textField",
            name: "%worldedit.config.structures",
            placeholder: "Leave blank for current clipboard",
            default: (ctx, player) => {
                if (ctx.getData("creatingTool"))
                    return "";
                return getToolProperty(ctx, player, "brush").imports?.join(" ") ?? "";
            }
        }
    },
    submit: (ctx, player, input) => {
        ctx.setData("toolData", [new StructureBrush(input.$structs?.split(" ") || getSession(player).clipboard, null), null, null, null]);
        finishToolEdit(ctx);
    },
    cancel: ctx => ctx.returnto("$tools")
});
Server.uiForms.register("$editTool_erosion_brush", {
    title: editToolTitle,
    inputs: {
        ...brushSizeInput,
        $erosion: {
            type: "dropdown",
            name: "%worldedit.config.erosion",
            options: ["Erode", "Lift", "Fill", "Melt", "Smooth"],
            default: (ctx, player) => {
                if (ctx.getData("creatingTool"))
                    return 0;
                return getToolProperty(ctx, player, "brush").getType();
            }
        },
        ...maskInput,
        ...usePickerInput
    },
    submit: (ctx, player, input) => {
        if (input.$usePicker) {
            ctx.setData("pickerData", {
                return: "$editTool_erosion_brush",
                onFinish: (ctx, _, mask) => {
                    ctx.setData("toolData", [new ErosionBrush(input.$size, input.$erosion), mask, null, null]);
                    finishToolEdit(ctx);
                }
            });
            HotbarUI.goto("$pickMask", player, ctx);
        }
        else {
            ctx.setData("toolData", [new ErosionBrush(input.$size, input.$erosion), new Mask(input.$mask), null, null]);
            finishToolEdit(ctx);
        }
    },
    cancel: ctx => ctx.returnto("$tools")
});
Server.uiForms.register("$editTool_overlay_brush", {
    title: editToolTitle,
    inputs: {
        ...brushSizeInput,
        ...brushPatternInput,
        $depth: {
            type: "slider",
            name: "%worldedit.config.depth",
            min: -10, max: 10,
            default: (ctx, player) => {
                if (ctx.getData("creatingTool"))
                    return 1;
                return getToolProperty(ctx, player, "brush").getDepth();
            }
        },
        ...maskInput,
        ...usePickerInput
    },
    submit: (ctx, player, input) => {
        if (input.$usePicker) {
            ctx.setData("pickerData", {
                return: "$editTool_overlay_brush",
                onFinish: (ctx, _, mask, pattern) => {
                    ctx.setData("toolData", [
                        new OverlayBrush(input.$size, input.$depth, pattern, null),
                        mask, null, null
                    ]);
                    finishToolEdit(ctx);
                }
            });
            HotbarUI.goto("$pickPatternMask", player, ctx);
        }
        else {
            ctx.setData("toolData", [
                new OverlayBrush(input.$size, input.$depth, new Pattern(input.$pattern), null),
                new Mask(input.$mask), null, null
            ]);
            finishToolEdit(ctx);
        }
    },
    cancel: ctx => ctx.returnto("$tools")
});
Server.uiForms.register("$selectToolType", {
    title: "%worldedit.config.choose.tool",
    buttons: [
        {
            text: "%worldedit.config.tool.selection",
            icon: "textures/ui/selection_wand",
            action: ctx => {
                ctx.setData("creatingTool", "selection_wand");
                finishToolEdit(ctx);
            }
        },
        {
            text: "%worldedit.config.tool.far_selection",
            icon: "textures/ui/far_selection_wand",
            action: ctx => {
                ctx.setData("creatingTool", "far_selection_wand");
                finishToolEdit(ctx);
            }
        },
        {
            text: "%worldedit.config.tool.navigation",
            icon: "textures/ui/navigation_wand",
            action: ctx => {
                ctx.setData("creatingTool", "navigation_wand");
                finishToolEdit(ctx);
            }
        },
        {
            text: "%worldedit.config.tool.stacker",
            icon: "textures/ui/stacker_wand",
            action: ctx => {
                ctx.setData("creatingTool", "stacker_wand");
                ctx.goto("$editTool_stacker_wand");
            }
        },
        {
            text: "%worldedit.config.tool.cmd",
            icon: "textures/ui/command_wand",
            action: ctx => {
                ctx.setData("creatingTool", "command_wand");
                ctx.goto("$editTool_command_wand");
            }
        },
        {
            text: "%worldedit.config.tool.repl",
            icon: "textures/ui/replacer_wand",
            action: ctx => {
                ctx.setData("creatingTool", "replacer_wand");
                ctx.goto("$editTool_replacer_wand");
            }
        },
        {
            text: "%worldedit.config.tool.cycle",
            icon: "textures/ui/cycler_wand",
            action: ctx => {
                ctx.setData("creatingTool", "cycler_wand");
                finishToolEdit(ctx);
            }
        }
    ],
    cancel: ctx => ctx.returnto("$tools")
});
Server.uiForms.register("$selectBrushType", {
    title: "%worldedit.config.choose.brush",
    buttons: [
        {
            text: "%worldedit.config.brush.sphere",
            icon: "textures/ui/sphere_brush",
            action: ctx => {
                ctx.setData("creatingTool", "sphere_brush");
                ctx.goto("$editTool_sphere_brush");
            }
        },
        {
            text: "%worldedit.config.brush.cylinder",
            icon: "textures/ui/cylinder_brush",
            action: ctx => {
                ctx.setData("creatingTool", "cylinder_brush");
                ctx.goto("$editTool_cylinder_brush");
            }
        },
        {
            text: "%worldedit.config.brush.smooth",
            icon: "textures/ui/smooth_brush",
            action: ctx => {
                ctx.setData("creatingTool", "smooth_brush");
                ctx.goto("$editTool_smooth_brush");
            }
        },
        {
            text: "%worldedit.config.brush.struct",
            icon: "textures/ui/structure_brush",
            action: ctx => {
                ctx.setData("creatingTool", "structure_brush");
                ctx.goto("$editTool_structure_brush");
            }
        },
        {
            text: "%worldedit.config.brush.erode",
            icon: "textures/ui/erosion_brush",
            action: ctx => {
                ctx.setData("creatingTool", "erosion_brush");
                ctx.goto("$editTool_erosion_brush");
            }
        },
        {
            text: "%worldedit.config.brush.overlay",
            icon: "textures/ui/overlay_brush",
            action: ctx => {
                ctx.setData("creatingTool", "overlay_brush");
                ctx.goto("$editTool_overlay_brush");
            }
        }
    ],
    cancel: ctx => ctx.returnto("$tools")
});
Server.uiForms.register("$confirmToolBind", {
    title: "%worldedit.config.confirm",
    message: "%worldedit.config.confirm.create",
    button1: {
        text: "%dr.button.ok",
        action: (ctx, player) => {
            const session = ctx.getData("session");
            const toolType = getToolType(ctx, player);
            const item = ctx.getData("currentItem");
            const toolData = ctx.getData("toolData");
            if (toolType == "selection_wand") {
                session.bindTool("selection_wand", item);
            }
            else if (toolType == "far_selection_wand") {
                session.bindTool("far_selection_wand", item);
            }
            else if (toolType == "navigation_wand") {
                session.bindTool("selection_wand", item);
            }
            else if (toolType == "stacker_wand") {
                session.bindTool("stacker_wand", item, ...toolData);
            }
            else if (toolType == "command_wand") {
                session.bindTool("command_wand", item, ...toolData);
            }
            else if (toolType == "replacer_wand") {
                session.bindTool("replacer_wand", item, ...toolData);
            }
            else if (toolType == "cycler_wand") {
                session.bindTool("cycler_wand", item);
            }
            else if (toolType.endsWith("brush")) {
                session.bindTool("brush", item, toolData[0], toolData[1]);
                Tools.setProperty(item, player.id, "range", toolData[2]);
                Tools.setProperty(item, player.id, "traceMask", toolData[3]);
            }
            ctx.returnto("$tools");
        }
    },
    button2: {
        text: "%gui.cancel",
        action: ctx => ctx.returnto("$tools")
    },
    cancel: ctx => ctx.returnto("$tools")
});
Server.uiForms.register("$confirmDelete", {
    title: "%worldedit.config.confirm",
    message: ctx => {
        const deleting = ctx.getData("deletingTools");
        let message = "%worldedit.config.confirm.delete";
        for (const item of deleting) {
            message += `\n${displayItem(item)}`;
        }
        return message;
    },
    button1: {
        text: "%dr.button.ok",
        action: ctx => {
            const session = ctx.getData("session");
            for (const item of ctx.getData("deletingTools")) {
                session.unbindTool(item);
            }
            ctx.returnto("$tools");
        }
    },
    button2: {
        text: "%gui.cancel",
        action: ctx => ctx.returnto("$tools")
    },
    cancel: ctx => ctx.returnto("$tools")
});
Server.uiForms.register("$deleteTools", {
    title: "%gui.delete",
    inputs: (ctx, player) => {
        const toggles = {};
        for (const tool of getTools(player, ctx.getData("editingBrush"))) {
            toggles[`$${tool}`] = {
                name: displayItem(tool),
                type: "toggle"
            };
        }
        return toggles;
    },
    submit: (ctx, _, input) => {
        const toDelete = [];
        for (const [key, value] of Object.entries(input)) {
            if (value) {
                const id = key.slice(1);
                toDelete.push(id);
            }
        }
        if (toDelete.length) {
            ctx.setData("deletingTools", toDelete);
            ctx.goto("$confirmDelete");
        }
        else {
            ctx.returnto("$tools");
        }
    },
    cancel: ctx => ctx.returnto("$tools")
});
