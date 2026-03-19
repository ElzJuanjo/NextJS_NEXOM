"use client";

import { useState } from "react";
import { Package, Plus, Edit3, Trash2, DollarSign, ImageOff } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-products";
import { useBrands } from "@/hooks/use-brands";
import { cn, formatCurrency } from "@/lib/utils";
import type { ProductResponse } from "@/types";

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const { data: brands } = useBrands();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductResponse | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", brand_id: "", description: "", sku: "", price_usd: "", image_url: "" });

  const openCreate = () => { setEditing(null); setForm({ name: "", brand_id: "", description: "", sku: "", price_usd: "", image_url: "" }); setShowForm(true); };
  const openEdit = (p: ProductResponse) => {
    setEditing(p);
    setForm({ name: p.name, brand_id: p.brand_id ?? "", description: p.description ?? "", sku: p.sku ?? "", price_usd: p.price_usd?.toString() ?? "", image_url: p.image_url ?? "" });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      brand_id: form.brand_id || undefined,
      description: form.description || undefined,
      sku: form.sku || undefined,
      price_usd: form.price_usd ? parseFloat(form.price_usd) : undefined,
      image_url: form.image_url || undefined,
    };
    if (editing) {
      updateProduct.mutate({ id: editing.id, ...payload }, { onSuccess: () => setShowForm(false) });
    } else {
      createProduct.mutate(payload, { onSuccess: () => setShowForm(false) });
    }
  };

  const filtered = products?.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <div className="flex flex-col h-full">
      <Header title="Productos" subtitle="Gestiona tu catálogo de productos" action={{ label: "Nuevo producto", onClick: openCreate }} />

      <div className="flex-1 p-6 space-y-4">
        {products && products.length > 0 && (
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar productos..."
            className="w-full max-w-sm px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
          />
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : !filtered.length ? (
          <EmptyState
            icon={Package}
            title={search ? "Sin resultados" : "Sin productos aún"}
            description={search ? "Intenta con otro término de búsqueda." : "Agrega tu primer producto o usa el agente de búsqueda para encontrar productos ganadores."}
            action={!search ? { label: "Agregar producto", onClick: openCreate } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => {
              const brand = brands?.find((b) => b.id === product.brand_id);
              return (
                <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden group animate-fade-in">
                  <div className="h-36 bg-muted flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageOff className="w-8 h-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">{product.name}</h3>
                      <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", product.is_active ? "bg-emerald-400" : "bg-muted-foreground")} />
                    </div>
                    {brand && <p className="text-xs text-pink-400">{brand.name}</p>}
                    {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      {product.price_usd ? (
                        <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-emerald-400" />{formatCurrency(product.price_usd)}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">Sin precio</span>}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-md hover:bg-accent transition-colors"><Edit3 className="w-3 h-3 text-muted-foreground" /></button>
                        <button onClick={() => { if (confirm("¿Eliminar?")) deleteProduct.mutate(product.id); }} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"><Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Editar producto" : "Nuevo producto"} className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Nombre</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">SKU</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Precio USD</label>
              <input value={form.price_usd} onChange={(e) => setForm({ ...form, price_usd: e.target.value })} type="number" step="0.01"
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Marca</label>
              <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all">
                <option value="">Sin marca</option>
                {brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all resize-none" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">URL de imagen</label>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
            </div>
          </div>
          <button type="submit" disabled={createProduct.isPending || updateProduct.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {(createProduct.isPending || updateProduct.isPending) ? <Spinner className="w-4 h-4 text-primary-foreground" /> : editing ? "Guardar" : "Crear producto"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
