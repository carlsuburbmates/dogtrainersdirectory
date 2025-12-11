import { CronHealthDashboard } from '@/components/admin/CronHealthDashboard'

export default function CronHealthPage() {
  return <CronHealthDashboard initialRefreshMs={60000} />
}
