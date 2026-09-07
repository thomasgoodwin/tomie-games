import { useEffect, useState } from "react";
import {
  Dialog,
  Portal,
  Input,
  Button,
  Tabs,
  Checkbox,
} from '@chakra-ui/react';
import { isValidUrl } from "@/util";

const PAGE_SIZE = 20;
const MAX_REROLLS = 5;
const DEFAULT_LANGUAGES = ["English"];

const fetchDirectory = async (apiUrl, secret, { q, page, languages }) => {
  const params = new URLSearchParams({ page, pageSize: PAGE_SIZE });
  if (q) {
    params.set("q", q);
  }
  if (languages?.length) {
    params.set("languages", languages.join(","));
  }
  const response = await fetch(`${apiUrl}/directory?${params}`, {
    headers: { 'X-Queue-Secret': secret },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch directory');
  }
  return response.json();
};

const fetchRandomSong = async (apiUrl, secret, reroll = 0, languages = []) => {
  const params = new URLSearchParams({ reroll });
  if (languages.length) {
    params.set("languages", languages.join(","));
  }
  const response = await fetch(`${apiUrl}/directory/random?${params}`, {
    headers: { 'X-Queue-Secret': secret },
  });
  if (!response.ok) {
    throw new Error('Failed to pick a random song');
  }
  return response.json();
};

const fetchLanguages = async (apiUrl, secret) => {
  const response = await fetch(`${apiUrl}/directory/languages`, {
    headers: { 'X-Queue-Secret': secret },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch languages');
  }
  return response.json();
};

// Shared by both the search results and "I'm Feeling Lucky" sides of the
// modal. At least one language must stay checked, so unchecking the last one
// is a no-op rather than leaving the filter empty (which would just mean "no
// songs match").
const LanguageFilter = ({ languages, selected, onChange }) => {
  if (languages.length === 0) {
    return null;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", marginTop: ".75rem" }}>
      {languages.map((language) => {
        const checked = selected.includes(language);
        return (
          <Checkbox.Root
            key={language}
            size="sm"
            checked={checked}
            onCheckedChange={() => {
              if (checked) {
                if (selected.length > 1) {
                  onChange(selected.filter((l) => l !== language));
                }
              } else {
                onChange([...selected, language]);
              }
            }}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>{language}</Checkbox.Label>
          </Checkbox.Root>
        );
      })}
    </div>
  );
};

const AddButton = ({ onAdd, link, title, size = "sm" }) => {
  // idle | adding | added | error
  const [status, setStatus] = useState("idle");
  return (
    <Button
      size={size}
      flexShrink={0}
      background={status === "error" ? "#DC2626" : "#06B6D4"}
      color="white"
      _hover={{ background: status === "error" ? "#B91C1C" : "#0891B2" }}
      loading={status === "adding"}
      disabled={status === "added"}
      onClick={async () => {
        setStatus("adding");
        const ok = await onAdd(link, title);
        setStatus(ok ? "added" : "error");
      }}
    >
      {status === "added" ? "Added" : status === "error" ? "Failed - Retry" : "Add"}
    </Button>
  );
};

// A song is often uploaded by several of the scraped channels; the backend
// groups those into one row with a representative "first" link/title (what
// the row's own Add button uses) plus the full per-channel variant list,
// expandable here so someone can pick a specific channel's version instead.
const DirectoryRow = ({ song, onAdd }) => {
  const [expanded, setExpanded] = useState(false);
  const hasVariants = song.variantCount > 1 && song.variants?.length > 0;
  return (
    <div style={{ margin: ".35rem 0px" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: ".5rem",
        padding: ".5rem .75rem",
        border: "1px solid rgba(6, 182, 212, 0.3)",
        borderLeft: "3px solid #06B6D4",
        borderRadius: hasVariants && expanded ? "6px 6px 0 0" : "6px",
        background: "rgba(6, 182, 212, 0.06)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "1rem", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {song.title}
          </div>
          <div style={{ fontSize: ".85rem", opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {song.artist || "Unknown Artist"}
          </div>
        </div>
        {hasVariants && (
          <Button
            size="sm"
            variant="ghost"
            flexShrink={0}
            onClick={() => setExpanded((e) => !e)}
          >
            {song.variantCount} versions {expanded ? "▲" : "▼"}
          </Button>
        )}
        <AddButton onAdd={onAdd} link={song.link} title={song.title} />
      </div>
      {hasVariants && expanded && (
        <div style={{
          border: "1px solid rgba(6, 182, 212, 0.3)",
          borderTop: "none",
          borderRadius: "0 0 6px 6px",
          background: "rgba(6, 182, 212, 0.02)",
        }}>
          {song.variants.map((variant) => (
            <div key={variant.id} style={{
              display: "flex",
              alignItems: "center",
              gap: ".5rem",
              padding: ".4rem .75rem .4rem 1.5rem",
              borderTop: "1px solid rgba(6, 182, 212, 0.15)",
            }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: ".85rem", opacity: 0.85 }}>
                {variant.channel || "Unknown channel"}
                {typeof variant.views === "number" && (
                  <span style={{ opacity: 0.6 }}> · {variant.views.toLocaleString()} views</span>
                )}
              </div>
              <AddButton onAdd={onAdd} link={variant.link} title={song.title} size="xs" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Shown in place of the search results once "I'm Feeling Lucky" is clicked.
// The song is only added when the user confirms; rerolling picks a new
// random song but does not add anything either. rerollsUsed/onReroll are
// lifted to the parent so the count survives going back to browse and
// picking lucky again, and it only resets when the modal itself reopens.
const LuckyPick = ({ apiUrl, secret, onAdd, onBack, rerollsUsed, onReroll, languages }) => {
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addStatus, setAddStatus] = useState("idle"); // idle | adding | added | error

  const rerollsLeft = MAX_REROLLS - rerollsUsed;

  const pick = async (reroll) => {
    setLoading(true);
    setError(null);
    setAddStatus("idle");
    try {
      const data = await fetchRandomSong(apiUrl, secret, reroll, languages);
      setSong(data);
    } catch {
      setError("Failed to pick a song.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    pick(rerollsUsed);
    // Re-picks when the language filter changes (the parent also resets
    // rerollsUsed to 0 in that case); reroll clicks call pick() directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languages]);

  return (
    <div style={{ marginTop: "1rem" }}>
      <Button size="sm" variant="ghost" onClick={onBack}>
        ← Back to search
      </Button>
      {loading && <p style={{ marginTop: "1rem" }}>Picking a song...</p>}
      {!loading && error && <p style={{ marginTop: "1rem" }}>{error}</p>}
      {!loading && !error && song && (
        <div style={{
          marginTop: "1rem",
          padding: "1.25rem 1rem",
          border: "1px solid rgba(6, 182, 212, 0.3)",
          borderLeft: "3px solid #06B6D4",
          borderRadius: "6px",
          background: "rgba(6, 182, 212, 0.06)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "1.15rem", fontWeight: "600" }}>{song.title}</div>
          <div style={{ fontSize: ".9rem", opacity: 0.75, marginTop: ".15rem" }}>
            {song.artist || "Unknown Artist"}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: ".75rem", marginTop: "1rem" }}>
            <Button
              size="sm"
              variant="outline"
              disabled={rerollsLeft <= 0 || loading}
              onClick={async () => {
                onReroll();
                await pick(rerollsUsed + 1);
              }}
            >
              Reroll{rerollsLeft > 0 ? ` (${rerollsLeft} left)` : ""}
            </Button>
            <Button
              size="sm"
              background={addStatus === "error" ? "#DC2626" : "#06B6D4"}
              color="white"
              _hover={{ background: addStatus === "error" ? "#B91C1C" : "#0891B2" }}
              loading={addStatus === "adding"}
              disabled={addStatus === "added"}
              onClick={async () => {
                setAddStatus("adding");
                const ok = await onAdd(song.link, song.title);
                setAddStatus(ok ? "added" : "error");
              }}
            >
              {addStatus === "added" ? "Added" : addStatus === "error" ? "Failed - Retry" : "Add to Queue"}
            </Button>
          </div>
          {rerollsLeft <= 0 && (
            <p style={{ fontSize: ".8rem", opacity: 0.7, marginTop: ".75rem" }}>
              No rerolls left for this session.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const AddSongModal = ({
  open,
  onOpenChange,
  apiUrl,
  secret,
  demoMode,
  newLink,
  setNewLink,
  onAddLink,
  onAddKnownSong,
}) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [linkStatus, setLinkStatus] = useState("idle"); // idle | adding | error
  const [showLucky, setShowLucky] = useState(false);
  const [rerollsUsed, setRerollsUsed] = useState(0);
  const [availableLanguages, setAvailableLanguages] = useState(DEFAULT_LANGUAGES);
  const [selectedLanguages, setSelectedLanguages] = useState(DEFAULT_LANGUAGES);

  const urlValid = isValidUrl(newLink);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleLanguagesChange = (nextLanguages) => {
    setSelectedLanguages(nextLanguages);
    setRerollsUsed(0);
  };

  useEffect(() => {
    if (!open) {
      setShowLucky(false);
      setRerollsUsed(0);
    }
  }, [open]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!open || demoMode) {
      return;
    }
    let cancelled = false;
    fetchLanguages(apiUrl, secret)
      .then((data) => {
        if (!cancelled && data.length > 0) {
          setAvailableLanguages(data);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, demoMode, apiUrl, secret]);

  useEffect(() => {
    if (!open || demoMode) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDirectory(apiUrl, secret, { q: debouncedQuery, page, languages: selectedLanguages })
      .then((data) => {
        if (cancelled) {
          return;
        }
        setResults(data.results);
        setTotal(data.total);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load the directory.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [open, demoMode, apiUrl, secret, debouncedQuery, page, selectedLanguages]);

  return (
    <Dialog.Root
      motionPreset="slide-in-bottom"
      lazyMount
      unmountOnExit
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Add a Song</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Tabs.Root defaultValue="browse" variant="enclosed">
                <Tabs.List>
                  <Tabs.Trigger value="browse">Browse Directory</Tabs.Trigger>
                  <Tabs.Trigger value="link">Paste a Link</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="browse">
                  {demoMode ? (
                    <p style={{ marginTop: "1rem" }}>
                      The directory needs a connected queue and isn't available in demo mode.
                    </p>
                  ) : showLucky ? (
                    <>
                      <LanguageFilter
                        languages={availableLanguages}
                        selected={selectedLanguages}
                        onChange={handleLanguagesChange}
                      />
                      <LuckyPick
                        apiUrl={apiUrl}
                        secret={secret}
                        onAdd={onAddKnownSong}
                        onBack={() => setShowLucky(false)}
                        rerollsUsed={rerollsUsed}
                        onReroll={() => setRerollsUsed((r) => r + 1)}
                        languages={selectedLanguages}
                      />
                    </>
                  ) : (
                    <>
                      <LanguageFilter
                        languages={availableLanguages}
                        selected={selectedLanguages}
                        onChange={handleLanguagesChange}
                      />
                      <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}>
                        <Input
                          size="md"
                          value={query}
                          placeholder="Search by title or artist..."
                          variant="subtle"
                          backgroundColor={"white"}
                          color="black"
                          flex={1}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button
                          size="md"
                          variant="outline"
                          flexShrink={0}
                          onClick={() => setShowLucky(true)}
                        >
                          I'm Feeling Lucky
                        </Button>
                      </div>
                      <div style={{ marginTop: ".75rem", maxHeight: "320px", overflowY: "auto" }}>
                        {loading && <p>Loading...</p>}
                        {!loading && error && <p>{error}</p>}
                        {!loading && !error && results.length === 0 && <p>No songs found.</p>}
                        {!loading && !error && results.map((song) => (
                          <DirectoryRow key={song.link} song={song} onAdd={onAddKnownSong} />
                        ))}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: ".75rem" }}>
                        <Button
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          Prev
                        </Button>
                        <span>Page {page} of {totalPages}</span>
                        <Button
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                          Next
                        </Button>
                      </div>
                    </>
                  )}
                </Tabs.Content>
                <Tabs.Content value="link">
                  <div style={{ display: "flex", marginTop: "1rem" }}>
                    <Input
                      size="md"
                      value={newLink}
                      placeholder="Paste a YouTube link..."
                      variant="subtle"
                      backgroundColor={"white"}
                      borderTopRightRadius={"0px"}
                      borderBottomRightRadius={"0px"}
                      borderTopLeftRadius={"8px"}
                      borderBottomLeftRadius={"8px"}
                      height="50px"
                      color="black"
                      onChange={(e) => {
                        setNewLink(e.target.value);
                        setLinkStatus("idle");
                      }}
                    />
                    <Button
                      size="md"
                      borderTopLeftRadius={"0px"}
                      borderBottomLeftRadius={"0px"}
                      height="50px"
                      paddingX={"1.25rem"}
                      background={"#06B6D4"}
                      color={"white"}
                      _hover={{ background: "#0891B2" }}
                      disabled={!urlValid}
                      loading={linkStatus === "adding"}
                      onClick={async () => {
                        setLinkStatus("adding");
                        const ok = await onAddLink();
                        setLinkStatus(ok ? "idle" : "error");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {linkStatus === "error" && (
                    <p style={{ color: "#EF4444", marginTop: ".5rem" }}>
                      Failed to add that song. Please try again.
                    </p>
                  )}
                </Tabs.Content>
              </Tabs.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default AddSongModal;
