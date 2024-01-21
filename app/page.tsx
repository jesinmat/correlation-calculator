"use client";
import { correlation } from "@/support/correlation";
import styles from "./page.module.css";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [suffix, setSuffix] = useState("");
  const [prevWrittenSymbols, setPrevWrittenSymbols] = useState<Set<string>>(
    new Set()
  );
  const [waitingForRequest, setWaitingForRequest] = useState<Set<string>>(
    new Set()
  );
  const [responses, setResponses] = useState<Map<string, any>>(new Map());

  const [debouncedText, setDebouncedText] = useState("");

  useEffect(() => {
    const timerId = setTimeout(() => {
      handleTickersChange(debouncedText.split("\n").slice(0, -1));
    }, 1000);

    return () => {
      clearTimeout(timerId);
    };
  }, [debouncedText]);

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    setDebouncedText(event.target.value);
  };

  const handleTickersChange = (tickers: string[]) => {
    const newTickers = tickers.filter(
      (ticker) => !prevWrittenSymbols.has(ticker)
    );

    setPrevWrittenSymbols(new Set([...prevWrittenSymbols, ...newTickers]));
    setWaitingForRequest(new Set([...waitingForRequest, ...newTickers]));
  };

  const loadTickerData = useCallback(async (ticker: string) => {
    const data = await fetch(`/api/ticker?ticker=${ticker}`);
    return await data.json();
  }, []);

  useEffect(() => {
    if (waitingForRequest.size > 0) {
      const ticker = waitingForRequest.values().next().value;
      loadTickerData(ticker).then((data) => {
        // Remove ticker from waitingForRequest
        setWaitingForRequest(
          new Set([...waitingForRequest].filter((t) => t !== ticker))
        );
        // Add ticker to responses
        setResponses((resp) => new Map([...resp, [ticker, data]]));
      });
    }
  }, [waitingForRequest]);

  const tickers = Array.from(
    new Set(
      text
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .filter((line) => responses.has(line))
    ).values()
  );

  const addSuffix = () => {
    if (suffix.trim().length === 0) {
      return;
    }
    const newTickers = text
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => line + suffix);
    setText(newTickers.join("\n"));
    handleTickersChange(newTickers);
  };

  return (
    <>
      <main className={styles.main}>
        <h1 className={styles.title}>Correlation calculator</h1>
        <section className={styles.content}>
          <div>
            <label htmlFor="tickers">Insert tickers:</label>
            <textarea
              id="tickers"
              className={styles.textarea}
              value={text}
              onChange={handleTextChange}
            />
            <div className={styles.inputGroup}>
              <input
                type="text"
                id="tickers"
                className={styles.textInput}
                value={suffix}
                maxLength={5}
                onChange={(e) => setSuffix(e.target.value)}
              />
              <button className={styles.button} onClick={addSuffix}>
                Add suffix
              </button>
            </div>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ticker</th>
                  {tickers.map((line) => (
                    <th key={line}>{line}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickers.map((ticker) => (
                  <tr key={ticker}>
                    <td>{ticker}</td>
                    {tickers.map((secondTicker) => (
                      <td key={ticker + secondTicker}>
                        {correlation(
                          responses.get(ticker),
                          responses.get(secondTicker)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
