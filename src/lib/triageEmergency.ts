import type { BehaviorIssue } from '@/types/database'

export type EmergencyFlow = 'medical' | 'stray' | 'crisis'

const EMERGENCY_ISSUE_FLOW_MAP: Readonly<Record<BehaviorIssue, EmergencyFlow | null>> = {
  pulling_on_lead: null,
  separation_anxiety: null,
  excessive_barking: null,
  dog_aggression: 'medical',
  leash_reactivity: null,
  jumping_up: null,
  destructive_behaviour: 'medical',
  recall_issues: null,
  anxiety_general: 'crisis',
  resource_guarding: 'crisis',
  mouthing_nipping_biting: 'medical',
  rescue_dog_support: 'stray',
  socialisation: null
}

const EMERGENCY_FLOW_PRIORITY: readonly EmergencyFlow[] = ['medical', 'stray', 'crisis']

export const inferEmergencyFlow = (
  selectedIssues: BehaviorIssue[]
): EmergencyFlow | null => {
  for (const flow of EMERGENCY_FLOW_PRIORITY) {
    if (selectedIssues.some((issue) => EMERGENCY_ISSUE_FLOW_MAP[issue] === flow)) {
      return flow
    }
  }

  return null
}

export const hasEmergencyEscalation = (selectedIssues: BehaviorIssue[]) =>
  inferEmergencyFlow(selectedIssues) !== null

export const getEmergencyIssueFlowMap = () => EMERGENCY_ISSUE_FLOW_MAP
