
setworldspawn 536.81 271.00 40.32
give @p dialog:bomi_menu
scoreboard players set @p level 0
tag @p add player
gamemode adventure
tp @p 536.81 271.00 40.32 facing 536 272 30
effect @p saturation 1000000 10 true
function remove_level_tags
function doors_reset
function walter_reset
