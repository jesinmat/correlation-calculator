import { type NextRequest } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("ticker");
  if (!query) {
    return Response.json({
      error: "Missing ticker query parameter",
    });
  }
  // Get data from Yahoo Finance starting from 2015-01-01
  try {
    const res = await yahooFinance.historical(query, {
      period1: 1420066800,
      interval: "1d",
    });
    return Response.json({ res });
  } catch (e) {
    return Response.json({
      error: "Ticker not found",
    });
  }
}
