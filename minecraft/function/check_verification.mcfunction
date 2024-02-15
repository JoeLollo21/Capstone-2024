dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=1},tag=!captain_1, tag=!captain_2] Verification_1_None
dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=1},tag=captain_1, tag=!captain_2] Verification_1_Captain_1
dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=1},tag=!captain_1, tag=captain_2] Verification_1_Captain_2
dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=1},tag=captain_1, tag=captain_2] Verification_1_Success
dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=2},tag=!nyt,tag=!codex,tag=!classified] Verification_2_None
dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=2},tag=nyt,tag=!codex,tag=!classified] Verification_2_NYT
dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=2},tag=codex,tag=!nyt,tag=!classified] Verification_2_Codex
dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=2},tag=classified,tag=!nyt,tag=!codex] Verification_2_Classified
dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=2},tag=!classified,tag=nyt,tag=codex] Verification_2_NYT_Codex
dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=2},tag=!nyt,tag=codex,tag=classified] Verification_2_Codex_Classified
dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=2},tag=!codex,tag=nyt,tag=classified] Verification_2_NYT_Classified
dialogue open @e[type=npc,c=1,tag=???] @p[scores={level=2},tag=codex,tag=nyt,tag=classified] Verification_2_Success
function check_misinfo