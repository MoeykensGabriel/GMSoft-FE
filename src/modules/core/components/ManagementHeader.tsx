import { LinkButton } from './LinkButton'
import { PageHeader } from './Page'

export function ManagementHeader({ title, description, createTo, createLabel }: {
  title: string; description: string; createTo: string; createLabel: string
}) {
  return <PageHeader title={title} description={description}
    actions={<LinkButton to={createTo} variant="primary">{createLabel}</LinkButton>} />
}
