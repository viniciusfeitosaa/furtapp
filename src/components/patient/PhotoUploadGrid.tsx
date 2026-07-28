"use client";

import { useActionState } from "react";
import type { UploadState } from "@/lib/patient/actions";
import { uploadCheckpointPhotoAction } from "@/lib/patient/actions";

const initial: UploadState = {};

type Region = { id: string; label: string };

type Props = {
  checkpointId: string;
  code: string;
  regions: readonly Region[];
  uploaded: string[];
};

export function PhotoUploadGrid({
  checkpointId,
  code,
  regions,
  uploaded,
}: Props) {
  const [state, action, pending] = useActionState(
    uploadCheckpointPhotoAction,
    initial,
  );

  return (
    <div>
      {state.error ? (
        <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mb-4 border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {state.success}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {regions.map((region) => {
          const done = uploaded.includes(region.id);
          return (
            <form
              key={region.id}
              action={action}
              className="flex flex-col gap-2 border border-dashed border-brand-gray-mid p-5"
            >
              <input type="hidden" name="checkpointId" value={checkpointId} />
              <input type="hidden" name="region" value={region.id} />
              <span className="text-sm font-medium">
                {region.label}
                {done ? (
                  <span className="ml-2 text-xs text-brand-gold-dark">
                    ✓ enviada
                  </span>
                ) : null}
              </span>
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                required={!done}
                disabled={pending}
                className="text-xs"
              />
              <button
                type="submit"
                disabled={pending}
                className="mt-1 w-fit bg-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Enviar — {code}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
