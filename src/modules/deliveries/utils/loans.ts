export interface LoanSelection {
  productId: string
  productDetail: string
  presta: number
  retiraPrestamo: number
}

export function loanLimits(fullOnBoard: number, sold: number, customerBalance: number) {
  return {
    maxOut: Math.min(1000, Math.max(0, fullOnBoard - sold)),
    maxIn: Math.min(1000, Math.max(0, customerBalance)),
    visible: fullOnBoard > 0 || customerBalance > 0,
  }
}

export function loanSummary(lines: LoanSelection[]) {
  return lines.flatMap((line) => [
    ...(line.presta > 0 ? [`Presta ${line.presta} ${line.productDetail} (sin cargo)`] : []),
    ...(line.retiraPrestamo > 0 ? [`Retira ${line.retiraPrestamo} ${line.productDetail}`] : []),
  ])
}
