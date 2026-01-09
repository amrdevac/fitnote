import { NextRequest, NextResponse } from "next/server";
import { getPinStatus, savePinSettings } from "@/lib/diary/pins";
import { isPinFormatValid, PIN_MAX_LENGTH, PIN_MIN_LENGTH, normalizePinInput } from "@/lib/diary/pinRules";

function invalidFormatMessage(label: string) {
  return `${label} harus terdiri dari angka ${PIN_MIN_LENGTH}-${PIN_MAX_LENGTH} digit.`;
}

export async function GET() {
  const status = await getPinStatus();
  return NextResponse.json(status);
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const status = await getPinStatus();

  const masterPin = normalizePinInput(body?.masterPin);
  const masterPinConfirm = typeof body?.masterPinConfirm === "string" ? body.masterPinConfirm.trim() : "";
  const decoyPin = normalizePinInput(body?.decoyPin);
  const decoyPinConfirm = typeof body?.decoyPinConfirm === "string" ? body.decoyPinConfirm.trim() : "";
  const clearDecoy = body?.clearDecoy === true;

  const updates: { masterPin?: string; decoyPin?: string | null } = {};
  let hasChange = false;
  const errors: string[] = [];

  if (masterPin !== undefined) {
    hasChange = true;
    if (masterPin !== masterPinConfirm) {
      errors.push("Konfirmasi master PIN tidak cocok.");
    } else if (!isPinFormatValid(masterPin)) {
      errors.push(invalidFormatMessage("Master PIN"));
    } else {
      updates.masterPin = masterPin;
    }
  }

  if (!status.hasMaster && masterPin === undefined) {
    errors.push("Setup awal membutuhkan master PIN.");
  }

  if (clearDecoy) {
    hasChange = true;
    if (!status.hasDecoy) {
      errors.push("Tidak ada decoy PIN yang bisa dihapus.");
    } else {
      updates.decoyPin = null;
    }
  } else if (decoyPin !== undefined) {
    hasChange = true;
    if (decoyPin !== decoyPinConfirm) {
      errors.push("Konfirmasi decoy PIN tidak cocok.");
    } else if (!isPinFormatValid(decoyPin)) {
      errors.push(invalidFormatMessage("Decoy PIN"));
    } else {
      updates.decoyPin = decoyPin;
    }
  }

  if (!hasChange) {
    return NextResponse.json({ error: "Tidak ada perubahan yang dikirimkan." }, { status: 400 });
  }
  if (errors.length) {
    return NextResponse.json({ error: errors[0], details: errors }, { status: 400 });
  }

  try {
    const nextStatus = await savePinSettings(updates);
    return NextResponse.json({ success: true, status: nextStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan PIN.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
