"use client";
import Table from "@/support/components/table";
import styles from "./page.module.css";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

function removeTimes(data: { res: Array<{ date: string }> }) {
  return {
    res: data.res.map((item) => ({
      ...item,
      date: item.date.split("T")[0] + "T01:00:00.000Z",
    })),
  };
}

export default function Home() {
  const [text, setText] = useState("");
  const [prevWrittenSymbols, setPrevWrittenSymbols] = useState<Set<string>>(
    new Set()
  );
  const [waitingForRequest, setWaitingForRequest] = useState<Set<string>>(
    new Set()
  );
  const [responses, setResponses] = useState<Map<string, any>>(new Map());

  const [debouncedText, setDebouncedText] = useState("");

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    setDebouncedText(event.target.value);
  };

  const handleTickersChange = useCallback(
    (tickers: string[]) => {
      const newTickers = tickers.filter(
        (ticker) => !prevWrittenSymbols.has(ticker)
      );

      if (newTickers.length === 0) {
        return;
      }

      setPrevWrittenSymbols((prev) => new Set([...prev, ...newTickers]));
      setWaitingForRequest((prev) => new Set([...prev, ...newTickers]));
    },
    [prevWrittenSymbols]
  );

  const loadTickerData = useCallback(async (ticker: string) => {
    const data = await fetch(`/api/ticker?ticker=${ticker}`);
    return await data.json();
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      handleTickersChange(
        debouncedText
          .split("\n")
          .slice(0, -1)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      );
    }, 1000);

    return () => {
      clearTimeout(timerId);
    };
  }, [debouncedText, handleTickersChange]);

  useEffect(() => {
    if (waitingForRequest.size > 0) {
      const ticker = waitingForRequest.values().next().value;
      loadTickerData(ticker).then((data) => {
        // Remove ticker from waitingForRequest
        setWaitingForRequest(
          new Set([...waitingForRequest].filter((t) => t !== ticker))
        );
        // Add ticker to responses
        setResponses((resp) => new Map([...resp, [ticker, removeTimes(data)]]));
      });
    }
  }, [waitingForRequest, loadTickerData]);

  const tickers = Array.from(
    new Set(
      text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .filter((line) => responses.has(line))
    ).values()
  );

  return (
    <>
      <main className={styles.main}>
        <h1 className={styles.title}>Correlation calculator</h1>
        <p className={styles.underTitle}>
          Easily calculate price correlation for your ETFs and Stocks.
        </p>
        <section className={styles.content}>
          <div className={styles.leftContainer}>
            <label htmlFor="tickers">
              <h4 className={styles.tickersListHeader}>Tickers:</h4>
            </label>
            <small>
              One per line. Include exchange suffix (.DE, .L, ...) if needed.
              End with new line.
            </small>
            <textarea
              id="tickers"
              className={styles.textarea}
              value={text}
              onChange={handleTextChange}
            />
            <div className={styles.info}>
              <div>Using weekly price correlation since 01-01-2025.</div>
              <div className={styles.legend}>
                <div className={styles.legendSymbol}>--</div>
                <div className={styles.legendExplanation}>
                  Symbol not found. Check exact symbol on Yahoo Finance.
                </div>
              </div>
              <div className={styles.legend}>
                <div className={styles.legendSymbol}>0</div>
                <div className={styles.legendExplanation}>Not enough data.</div>
              </div>
            </div>
          </div>
          <div className={styles.tableContainer}>
            <Table tickers={tickers} responses={responses} />
          </div>
        </section>
      </main>
    </>
  );
}
