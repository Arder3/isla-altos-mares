import { supabase } from './supabaseClient';

/**
 * CesarOrchestrator.js
 * 
 * Logic to manage the "Altar 2.0" Group Chat flow.
 * Handles mentions, permission checks, and sub-chat generation.
 */

export const CESAR_ID = 'cesar_orchestrator';

// Specialized Agents (Hadas and Duendes)
export const AGENTS = {
  'eco-chat': {
    name: "Interlocutor (Eco)",
    skill: "@Narrative",
    persona: "El Puente de Visiones. Su misión es entrevistar a Alma para desgranar sus ideas. No crea el asset final, sino que construye el 'Eco Creativo' (el prompt perfecto) que Brush usará para el arte o Script para el guion.",
    avatar: "🕊️"
  },
  'brush-chat': {
    name: "Brush",
    skill: "@Art",
    persona: "Director Visual. Recibe el 'Eco Creativo' del Interlocutor y lo traduce en estéticas, turnarounds y diseños maestros de Altos Mares.",
    avatar: "🎨"
  },
  'script-chat': {
    name: "Script",
    skill: "@ScriptWriter",
    persona: "Escriba de Guiones. Toma el 'Eco Creativo' del Interlocutor y lo transmuta en escenas, diálogos y acción técnica lista para producción.",
    avatar: "🖋️"
  }
};

/**
 * Check if the Father (Ariel) has granted permission for a specific skill session
 */
export async function checkPermissions(sessionId, userId, skill) {
  const { data, error } = await supabase
    .from('altar_permissions')
    .select('*')
    .eq('session_id', sessionId)
    .eq('granted_to_user_id', userId)
    .eq('skill_authorized', skill)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .single();

  if (error || !data) return false;
  return true;
}

/**
 * Handle a message sent in the main chat
 * @returns {Object|null} - Action to take (response, link, or nothing)
 */
export async function processUIMessage(message, currentSession, userRole) {
  const content = message.content.trim();
  const isMention = content.toLowerCase().includes('@cesar');

  if (!isMention) return null;

  // 1. Father gives an order
  if (userRole === 'host') {
    // Basic NLP for orders (could be upgraded with Gemini)
    if (content.toLowerCase().includes('ayuda a alma con')) {
       // Logic to grant permission and call a sub-agent
       return {
         action: 'PERMISSION_GRANTED',
         target: 'alma',
         response: 'Entendido, Padre de la Isla. ¿Qué Hada o Duende deseas que asista a Alma?'
       };
    }
    
    return {
      action: 'SYSTEM_REPLY',
      response: 'Sí, Padre. Estoy atento a tus designios.'
    };
  }

  // 2. Alma tries to command César
  if (userRole === 'kids') {
     return {
       action: 'SYSTEM_REPLY',
       response: 'Escucho tus deseos, Alma. Esperaré a que el Padre de la Isla me indique que hoy es el momento de tejer esa magia.'
     };
  }

  return null;
}

/**
 * Generate a Sub-chat Lab Link
 */
export async function createLabSession(parentSessionId, almaUserId, agentId, taskGoal) {
  const agent = AGENTS[agentId];
  if (!agent) throw new Error("Agent not found");

  const { data, error } = await supabase
    .from('altar_sub_chats')
    .insert({
      parent_session_id: parentSessionId,
      alma_user_id: almaUserId,
      agent_id: agentId,
      skill_name: agent.skill,
      task_goal: taskGoal,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
