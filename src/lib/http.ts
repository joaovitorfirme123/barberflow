import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Confira os dados enviados.", details: error.issues },
      { status: 400 },
    );
  }

  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
    return NextResponse.json({ error: "Esse registro já existe." }, { status: 409 });
  }

  console.error("Unhandled API error", error);
  return NextResponse.json({ error: "Não foi possível concluir a operação." }, { status: 500 });
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
