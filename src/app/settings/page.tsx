"use client";

import { useMemo, useState } from "react";
import SwipeNavigation from "@/components/SwipeNavigation";
import BottomNav from "@/components/shared/BottomNav";
import PageHeader from "@/components/shared/PageHeader";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { useToast } from "@/ui/use-toast";
import useWorkoutSession from "@/hooks/useWorkoutSession";

const SettingsPage = () => {
  const { toast } = useToast();
  const { movementLibrary, addCustomMovement, renameMovementOption, deleteMovementOption } =
    useWorkoutSession();

  const [newMovementName, setNewMovementName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"root" | "movements">("root");

  const sortedMovements = useMemo(
    () =>
      [...movementLibrary].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [movementLibrary]
  );

  const handleAddMovement = () => {
    const result = addCustomMovement(newMovementName);
    if (!result.success) {
      toast({ title: "Unable to add movement", description: result.error, variant: "error" });
      return;
    }
    setNewMovementName("");
    toast({ title: "Movement added", variant: "success" });
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const result = renameMovementOption(editingId, editingName);
    if (!result.success) {
      toast({ title: "Unable to update movement", description: result.error, variant: "error" });
      return;
    }
    setEditingId(null);
    setEditingName("");
    toast({ title: "Movement updated", variant: "success" });
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return;
    const result = deleteMovementOption(confirmDeleteId);
    if (!result.success) {
      toast({ title: "Unable to delete movement", description: result.error, variant: "error" });
      return;
    }
    setConfirmDeleteId(null);
    toast({ title: "Movement deleted", variant: "success" });
  };

  return (
    <SwipeNavigation leftRoute="/" className="min-h-dvh bg-slate-50">
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-12 pt-8 text-slate-900">
        <PageHeader title={activeSection === "movements" ? "Movement Library" : "Settings"} />

        {activeSection === "root" && (
          <section className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => setActiveSection("movements")}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300"
            >
              <p className="text-sm font-semibold text-slate-900">Movement Library</p>
              <p className="mt-1 text-xs text-slate-500">
                Add, rename, or remove movements used in the workout builder.
              </p>
            </button>
          </section>
        )}

        {activeSection === "movements" && (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={() => setActiveSection("root")}>
                Back to settings
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Manage Movements</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Update your movement list for quick selection in the builder.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  placeholder="Add a new movement"
                  value={newMovementName}
                  onChange={(event) => setNewMovementName(event.target.value)}
                />
                <Button type="button" onClick={handleAddMovement} disabled={!newMovementName.trim()}>
                  Add
                </Button>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {sortedMovements.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-500">No movements yet.</p>
                )}
                {sortedMovements.map((movement) => {
                  const isEditing = editingId === movement.id;
                  return (
                    <div
                      key={movement.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex-1">
                        {isEditing ? (
                          <Input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleSaveEdit();
                              }
                            }}
                          />
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-slate-900">{movement.name}</p>
                            <p className="text-xs text-slate-500">{movement.description}</p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                            <Button type="button" onClick={handleSaveEdit} disabled={!editingName.trim()}>
                              Save
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleStartEdit(movement.id, movement.name)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setConfirmDeleteId(movement.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <BottomNav />

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Delete movement?"
        message="This will remove the movement from your library."
        confirmText="Delete"
        cancelText="Cancel"
        variant="overlay"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </SwipeNavigation>
  );
};

export default SettingsPage;
