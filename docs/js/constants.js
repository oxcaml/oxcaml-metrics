// Shared constants for the dashboard

// Phase name mapping for compiler phases
// Maps internal phase names to display names
const PHASE_NAME_MAP = {
    '<all>': 'all',
    'parsing': 'parsing',
    'typing': 'typing',
    'generate/flambda2': 'flambda2',
    'generate/compile_phrases/cfg': 'CFG',
    'generate/assemble': 'assemble'
};

// Function to map a phase name to its display name
function mapPhaseName(phaseName) {
    return PHASE_NAME_MAP[phaseName] || phaseName;
}
