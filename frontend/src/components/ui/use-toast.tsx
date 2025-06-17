import * as React from "react"
import { toast as sonnerToast, Toaster as Sonner } from "sonner"

const toastConfig = {
  className: "border-border bg-background text-foreground",
  descriptionClassName: "text-muted-foreground",
  closeButton: true,
  duration: 3000,
}

export function Toaster() {
  return <Sonner {...toastConfig} />
}

export { sonnerToast as toast } 