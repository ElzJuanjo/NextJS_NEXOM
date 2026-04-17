import Swal from "sweetalert2";

/**
 * Confirm dialog estilizado con SweetAlert2 + tema dark NEXOM.
 * Retorna `true` si el usuario confirma, `false` si cancela.
 */
export async function confirmDelete(message: string = "¿Eliminar permanentemente?"): Promise<boolean> {
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    background: "#1a1b23",
    color: "#e4e4e7",
    iconColor: "#f59e0b",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#27272a",
    customClass: {
      popup: "rounded-xl border border-white/10",
      confirmButton: "rounded-lg text-sm font-medium px-4 py-2",
      cancelButton: "rounded-lg text-sm font-medium px-4 py-2",
    },
  });
  return result.isConfirmed;
}

/** Toast rápido de éxito (reemplaza los toast.success si se necesita algo más visual) */
export function swalSuccess(message: string) {
  Swal.fire({
    icon: "success",
    title: message,
    timer: 1800,
    showConfirmButton: false,
    background: "#1a1b23",
    color: "#e4e4e7",
    iconColor: "#34d399",
    customClass: {
      popup: "rounded-xl border border-white/10",
    },
  });
}
