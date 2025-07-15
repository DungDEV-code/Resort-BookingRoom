"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({ open, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bạn có chắc chắn muốn xoá?</DialogTitle>
        </DialogHeader>
        <div className="text-gray-600">
          Hành động này sẽ xoá vĩnh viễn loại phòng. Bạn không thể khôi phục lại.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="destructive" onClick={onConfirm}>Xác nhận xoá</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
