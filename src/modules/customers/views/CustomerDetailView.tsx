import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, ErrorMessage, Page, PageHeader, Panel, BackButton } from '../../core'
import { CustomerAccountMovements } from '../components/CustomerAccountMovements'
import { CustomerBalanceCard } from '../components/CustomerBalanceCard'
import { CustomerContainersSummary } from '../components/CustomerContainersSummary'
import { CustomerProfileCard } from '../components/CustomerProfileCard'
import { customerService } from '../services/customerService'

export function CustomerDetailView() {
  const { id } = useParams()
  const customer = useQuery({ queryKey: ['customers', 'detail', id], queryFn: () => customerService.getById(id!), enabled: Boolean(id) })
  const account = useQuery({ queryKey: ['customers', 'account', id], queryFn: () => customerService.getAccount(id!), enabled: Boolean(id), staleTime: 0 })

  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <BackButton to="/panel/clientes" label="Volver a Clientes" appearance="link" />
    <PageHeader title="Datos del cliente" />
    {customer.isPending || account.isPending ? <p role="status">Cargando cliente…</p>
      : customer.isError || account.isError ? <div className="flex flex-col gap-3">
        <ErrorMessage error={customer.error ?? account.error} />
        <Button variant="secondary" onClick={() => { void customer.refetch(); void account.refetch() }}>Reintentar</Button>
      </div> : <>
        {customer.data.removalPending && <p role="status" className="rounded border border-warning/40 bg-warning-soft p-3 text-warning">
          El chofer pidió dar de baja a este cliente y ya no aparece en su hoja. <Link to="/panel/bajas" className="underline">Confirmá o rechazá la baja</Link>.
        </p>}
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3">
            <CustomerProfileCard customer={customer.data} headingLevel={2} editTo={`/panel/clientes/${encodeURIComponent(customer.data.id)}/editar`} />
            <p className="text-sm"><strong>Estado:</strong> <Badge>{customer.data.isActive ? 'Activo' : 'Inactivo'}</Badge></p>
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <CustomerBalanceCard balance={account.data.balance} />
            <Panel title="Envases en poder del cliente">
              <p className="text-sm"><CustomerContainersSummary account={account.data} /></p>
            </Panel>
          </div>
        </div>
        <Panel aria-label="Movimientos de la cuenta">
          <CustomerAccountMovements account={account.data} />
        </Panel>
      </>}
  </Page>
}
