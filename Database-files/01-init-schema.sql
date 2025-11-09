-- EchoWords Database Schema
-- This file is automatically run when the Docker container first starts

-- Create the players table
CREATE TABLE IF NOT EXISTS public.players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    clientid TEXT,
    lobbyid VARCHAR(50),
    avatarseed TEXT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_clientid ON public.players (clientid);
CREATE INDEX IF NOT EXISTS idx_players_lobbyid ON public.players (lobbyid);

-- Create the player_match_results table
CREATE TABLE IF NOT EXISTS public.player_match_results (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES public.players(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    words_submitted INTEGER NOT NULL DEFAULT 0,
    accuracy INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_player_match_results_player_id ON public.player_match_results (player_id);

-- Create the playerwords table (word submission history)
CREATE TABLE IF NOT EXISTS public.playerwords (
    id SERIAL PRIMARY KEY,
    wordinput VARCHAR(255) NOT NULL,
    clientid TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_playerwords_clientid ON public.playerwords (clientid);

-- Create the words table (word dictionary)
CREATE TABLE IF NOT EXISTS public.words (
    word VARCHAR(255) NOT NULL,
    clientid TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS words_word_uindex ON public.words (word);
CREATE INDEX IF NOT EXISTS words_clientid ON public.words (clientid);

-- Set ownership
ALTER TABLE public.players OWNER TO postgres;
ALTER TABLE public.player_match_results OWNER TO postgres;
ALTER TABLE public.playerwords OWNER TO postgres;
ALTER TABLE public.words OWNER TO postgres;
