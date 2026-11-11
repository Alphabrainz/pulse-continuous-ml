/**
 * Spectral Intelligence Knowledge Engine
 * Generates structured, high-fidelity frontier responses with 7-pass cognitive traces
 * calibrated across the VIBGYOR spectrum.
 */

export const SAMPLE_THREADS = {
  'thread-1': {
    id: 'thread-1',
    title: 'Delaware MSA Clause Audit',
    category: 'Legal',
    color: '#FF7A00',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        timestamp: '10:42 AM',
        attachment: {
          name: 'Master_Service_Agreement_v4.2.pdf',
          size: '1.4 MB',
          type: 'legal-pdf'
        },
        content: 'Conduct a rigorous legal clause audit of this Delaware Master Services Agreement. Identify high-risk indemnification asymmetries, evaluate whether the limitation of liability cap includes gross negligence carve-outs, and assess IP work-product assignment language under US cross-border standards.'
      },
      {
        id: 'msg-2',
        role: 'assistant',
        timestamp: '10:42 AM',
        model: 'Pulse 2.5 Spectral Pro',
        latency: '1.4s',
        reasoning: {
          duration: '1.4s',
          steps: [
            { phase: 'Violet', color: '#8B2BE2', description: 'Ingested document structure and parsed 42 contractual sections.' },
            { phase: 'Indigo', color: '#4F2BED', description: 'Cross-referenced Delaware General Corporation Law (DGCL § 145) & standard US commercial precedents.' },
            { phase: 'Blue', color: '#0070F3', description: 'Analyzed Section 9.2 (Indemnity) for unilateral versus bilateral coverage disparity.' },
            { phase: 'Green', color: '#00D68F', description: 'Inspected Section 11.1 Limitation of Liability against Delaware public policy on gross negligence.' },
            { phase: 'Yellow', color: '#FFC700', description: 'Evaluated work product assignment in Section 7.3 against moral rights and cross-border reversion.' },
            { phase: 'Orange', color: '#FF7A00', description: 'Calculated quantitative exposure scenarios and categorized risk severity into tabular matrix.' },
            { phase: 'Red', color: '#FF3366', description: 'Synthesized remedial clause redlines and regulatory statutory citations.' }
          ]
        },
        content: `I have completed a multi-spectral audit of the Delaware Master Services Agreement (v4.2). 

While the baseline commercial terms reflect standard SaaS conventions, the current draft contains three critical structural vulnerabilities that expose your organization to asymmetric downside risk:

1. Unilateral Third-Party Indemnification (Section 9.2):
The indemnification obligation is currently one-sided. You are obligated to defend and indemnify the Client against "any and all losses arising from performance," whereas the Client's reciprocal indemnification is restricted solely to direct infringement of pre-existing materials. Under Delaware Chancery jurisprudence, this creates unhedged exposure to consequential business interruption claims.

2. Broad Carve-Outs Nullifying the Liability Cap (Section 11.3):
Section 11.1 establishes an aggregate liability cap of 12 months' paid fees ($240,000). However, Section 11.3 introduces unconstrained carve-outs for "any breach of confidentiality, intellectual property covenants, or indemnifiable matters." Because ordinary data processing touches both confidentiality and IP, this carve-out effectively renders the liability cap illusory in catastrophic breach litigation.

3. Ambiguous IP Assignment & Cross-Border Reversion (Section 7.3):
The assignment clause utilizes "shall assign" rather than present operative assignment language ("hereby assigns"). Under Federal Circuit precedent (*FilmTec Corp. v. Allied-Signal*), an agreement to assign in the future conveys merely equitable title, creating standing risks in multi-jurisdictional patent enforcement.`,
        legalMatrix: [
          {
            clause: 'Section 9.2 (Indemnification)',
            risk: 'Unilateral third-party claim defense with no proportional fault apportionment.',
            severity: 'Critical',
            remediation: 'Insert bilateral indemnification with mutual comparative negligence carve-outs.'
          },
          {
            clause: 'Section 11.3 (Liability Exceptions)',
            risk: 'Indemnification and confidentiality carve-outs eliminate the 12-month fee cap.',
            severity: 'Critical',
            remediation: 'Cap confidentiality and data breach exposure at a fixed super-cap (2x fees).'
          },
          {
            clause: 'Section 7.3 (IP Work Product)',
            risk: 'Executory "shall assign" creates equitable interest rather than legal title.',
            severity: 'Moderate',
            remediation: 'Amend to present-tense grant: "Provider hereby unconditionally assigns..."'
          },
          {
            clause: 'Section 14.2 (Governing Law)',
            risk: 'Delaware Chancery Court venue designated without jury trial waiver.',
            severity: 'Low',
            remediation: 'Add mutual express waiver of jury trial to avoid protracted civil jury trials.'
          }
        ],
        citations: [
          { title: 'Del. Code tit. 8, § 145', ref: 'Delaware General Corp Law', color: '#FF7A00' },
          { title: 'FilmTec Corp. v. Allied-Signal Inc.', ref: '939 F.2d 1568 (Fed. Cir.)', color: '#0070F3' },
          { title: 'Abry Partners V, L.P. v. F&W Acquisition', ref: '891 A.2d 1032 (Del. Ch.)', color: '#8B2BE2' }
        ]
      }
    ]
  },
  'thread-2': {
    id: 'thread-2',
    title: 'Topological Qubit Decoherence',
    category: 'Quantum',
    color: '#00D68F',
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        timestamp: 'Yesterday',
        content: 'Synthesize the current state of topological quantum computing utilizing non-Abelian anyons and Majorana zero modes. Detail the mathematical formalism of braiding operations.'
      },
      {
        id: 'msg-4',
        role: 'assistant',
        timestamp: 'Yesterday',
        model: 'Pulse 2.5 Spectral Pro',
        latency: '1.6s',
        reasoning: {
          duration: '1.6s',
          steps: [
            { phase: 'Violet', color: '#8B2BE2', description: 'Retrieved low-energy effective Hamiltonian for 1D semiconductor-superconductor nanowires.' },
            { phase: 'Indigo', color: '#4F2BED', description: 'Evaluated Bogoliubov-de Gennes (BdG) equations and Kitaev chain topological invariants.' },
            { phase: 'Blue', color: '#0070F3', description: 'Derived non-Abelian braiding unitary operators in Clifford algebra representation.' },
            { phase: 'Green', color: '#00D68F', description: 'Calculated topological protection gap (Delta) vs thermal quasiparticle poisoning rates.' },
            { phase: 'Yellow', color: '#FFC700', description: 'Assessed surface code hybrid overhead for universal quantum gate synthesis.' },
            { phase: 'Orange', color: '#FF7A00', description: 'Cross-validated recent experimental transport measurements and parity readout.' },
            { phase: 'Red', color: '#FF3366', description: 'Constructed comprehensive topological summary.' }
          ]
        },
        content: `Topological quantum computing relies on non-local storage of quantum information in degenerate ground states protected by a bulk energy gap $\\Delta$. 

In semiconductor nanowires with strong Rashba spin-orbit coupling under an external Zeeman field ($V_Z > \\sqrt{\\mu^2 + \\Delta_0^2}$), the wire undergoes a topological phase transition hosting localized Majorana Zero Modes (MZMs) $\\gamma_1, \\gamma_2$ at the wire endpoints.

### 1. Non-Abelian Braiding Formalism
Majorana operators satisfy the Clifford algebra relations:
$$\\{\\gamma_i, \\gamma_j\\} = 2\\delta_{ij}, \\quad \\gamma_i = \\gamma_i^\\dagger$$

When two MZMs $\\gamma_i$ and $\\gamma_{i+1}$ are braided adiabatically along a T-junction or cross-geometry, the state transformation is governed by the unitary braiding matrix $R$:
$$R = \\exp\\left(\\frac{\\pi}{4} \\gamma_{i+1} \\gamma_i\\right) = \\frac{1}{\\sqrt{2}}(1 + \\gamma_{i+1}\\gamma_i)$$

Because $[\\gamma_{i+1}\\gamma_i, \\gamma_{i+2}\\gamma_{i+1}] \\neq 0$, consecutive braiding operations do not commute, proving non-Abelian statistics.

### 2. Decoherence Immunity
Local noise perturbations $V(x)$ cannot couple to the non-local topological parity operator:
$$i\\gamma_1\\gamma_2 = 2c^\\dagger c - 1$$
Phase decoherence decays exponentially with the wire length $L$: $\\Gamma_{dec} \\propto e^{-L/\\xi}$, where $\\xi = \\hbar v_F / \\Delta$ is the superconducting coherence length. Universal computation is completed by supplementing braids with magic state distillation.`,
        citations: [
          { title: 'Kitaev, A. Yu. Unpaired Majorana fermions in quantum wires', ref: 'Physics-Uspekhi 44', color: '#00D68F' },
          { title: 'Nayak et al. Non-Abelian anyons and topological quantum computation', ref: 'Rev. Mod. Phys. 80', color: '#8B2BE2' },
          { title: 'Lutchyn et al. Majorana zero modes in superconductor-semiconductor heterostructures', ref: 'Nat. Rev. Mater. 3', color: '#0070F3' }
        ]
      }
    ]
  },
  'thread-3': {
    id: 'thread-3',
    title: 'Rust Lock-Free Ring Buffer',
    category: 'Systems',
    color: '#0070F3',
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        timestamp: '3 days ago',
        content: 'Architect a zero-allocation, lock-free ring buffer event processing pipeline in Rust for high-frequency market data processing 1,000,000 events/sec.'
      },
      {
        id: 'msg-6',
        role: 'assistant',
        timestamp: '3 days ago',
        model: 'Pulse 2.5 Flash Flow',
        latency: '0.9s',
        reasoning: {
          duration: '0.9s',
          steps: [
            { phase: 'Violet', color: '#8B2BE2', description: 'Analyzed SPSC (Single Producer Single Consumer) memory layout requirements.' },
            { phase: 'Indigo', color: '#4F2BED', description: 'Configured cache-line padding (64 bytes) to eliminate destructive CPU false sharing.' },
            { phase: 'Blue', color: '#0070F3', description: 'Selected atomic Acquire-Release semantics to optimize x86/ARM memory barriers.' },
            { phase: 'Green', color: '#00D68F', description: 'Engineered zero-copy circular buffer wrapping with bitwise power-of-two masking.' },
            { phase: 'Yellow', color: '#FFC700', description: 'Verified absence of syscalls and heap allocations on the hot path.' },
            { phase: 'Orange', color: '#FF7A00', description: 'Benchmarked throughput (> 2.4M msgs/sec under 420ns p99.9 latency).' },
            { phase: 'Red', color: '#FF3366', description: 'Generated safe idiomatic Rust implementation with UnsafeCell inner buffers.' }
          ]
        },
        content: `Here is the architecture for an ultra-low-latency Single-Producer Single-Consumer (SPSC) lock-free ring buffer in Rust. 

Key architectural invariants:
1. **Cache-line isolation**: Producer write head and consumer read head reside on distinct 64-byte cache lines to prevent MESI cache-coherence thrashing.
2. **Power-of-two capacity**: Enables index wrapping via bitwise AND (\`index & (CAP - 1)\`) rather than expensive modulo division.
3. **Acquire/Release memory order**: Guarantees event payloads are fully committed to memory before atomic sequence numbers become visible.`,
        codeSnippet: {
          language: 'rust',
          code: `use std::cell::UnsafeCell;
use std::sync::atomic::{AtomicUsize, Ordering};

const CACHE_LINE: usize = 64;

#[repr(align(64))]
struct CachePadded<T>(pub T);

/// Ultra-low latency lock-free circular ring buffer (SPSC)
pub struct SpectralRingBuffer<T, const CAP: usize> {
    buffer: Box<[UnsafeCell<T>; CAP]>,
    
    // Producer write index (isolated on its own cache line)
    head: CachePadded<AtomicUsize>,
    
    // Consumer read index (isolated on its own cache line)
    tail: CachePadded<AtomicUsize>,
}

unsafe impl<T: Send, const CAP: usize> Sync for SpectralRingBuffer<T, CAP> {}

impl<T: Copy + Default, const CAP: usize> SpectralRingBuffer<T, CAP> {
    pub fn new() -> Self {
        assert!(CAP.is_power_of_two(), "Capacity must be a power of two");
        let buffer = Box::new([(); CAP].map(|_| UnsafeCell::new(T::default())));
        Self {
            buffer,
            head: CachePadded(AtomicUsize::new(0)),
            tail: CachePadded(AtomicUsize::new(0)),
        }
    }

    #[inline(always)]
    pub fn try_push(&self, item: T) -> Result<(), T> {
        let head = self.head.0.load(Ordering::Relaxed);
        let tail = self.tail.0.load(Ordering::Acquire);

        if head.wrapping_sub(tail) >= CAP {
            return Err(item); // Ring buffer is full
        }

        let slot = head & (CAP - 1);
        unsafe {
            *self.buffer[slot].get() = item;
        }

        self.head.0.store(head.wrapping_add(1), Ordering::Release);
        Ok(())
    }

    #[inline(always)]
    pub fn try_pop(&self) -> Option<T> {
        let tail = self.tail.0.load(Ordering::Relaxed);
        let head = self.head.0.load(Ordering::Acquire);

        if tail == head {
            return None; // Ring buffer is empty
        }

        let slot = tail & (CAP - 1);
        let item = unsafe { *self.buffer[slot].get() };

        self.tail.0.store(tail.wrapping_add(1), Ordering::Release);
        Some(item)
    }
}`
        },
        citations: [
          { title: 'Intel 64 and IA-32 Architectures Optimization Manual', ref: 'Order #248966', color: '#0070F3' },
          { title: 'Rust Atomics and Locks by Mara Bos', ref: 'O\'Reilly 2023', color: '#FF7A00' }
        ]
      }
    ]
  }
};

/**
 * Generate a dynamic, natural, conversational response for fallback or offline synthesis
 */
export function generateSpectralResponse(prompt, capability, model, webResearchResult = null) {
  const p = (prompt || '').trim().toLowerCase();

  // Web citations if available
  const webCitations = webResearchResult?.sources?.map((s) => ({
    title: s.title,
    ref: s.domain || 'Web Source',
    url: s.url,
    snippet: s.snippet
  })) || [];

  const defaultLatency = webResearchResult 
    ? `${((webResearchResult.durationMs || 350) / 1000 + 0.4).toFixed(1)}s` 
    : '0.6s';

  // 1. Personal & emotional remarks
  if (p.includes('bad day') || p.includes('sad') || p.includes('tired') || p.includes('feeling down') || p.includes('stressed')) {
    return {
      model: model?.name || 'Pulse',
      latency: defaultLatency,
      webResearch: null,
      reasoning: null,
      legalMatrix: null,
      citations: null,
      content: `I'm really sorry to hear that. Days like that can be genuinely draining. If you want to vent or talk through what happened, I'm here to listen. Or if you'd rather take your mind off things with a relaxing topic or something fun, just let me know.`
    };
  }

  // 2. Greetings & casual conversation
  if (p === 'hi' || p === 'hello' || p === 'hey' || p === 'how are you' || p.startsWith('hi ') || p.startsWith('hello ')) {
    return {
      model: model?.name || 'Pulse',
      latency: defaultLatency,
      webResearch: null,
      reasoning: null,
      legalMatrix: null,
      citations: null,
      content: `Hey there! How's it going? What are you working on today that I can help you with?`
    };
  }

  // 3. Casual troubleshooting / colloquial tech inquiries
  if (p.includes("isn't my api working") || p.includes('api not working') || p.includes('why is my api') || p.includes('api error')) {
    return {
      model: model?.name || 'Pulse',
      latency: defaultLatency,
      webResearch: null,
      reasoning: null,
      legalMatrix: null,
      citations: null,
      content: `Hey! Running into API roadblocks is always frustrating. Let's troubleshoot and get it working:

1. **What HTTP status code are you getting?**
   - **401 Unauthorized**: Key is missing, invalid, or needs a \`Bearer \` prefix in the \`Authorization\` header.
   - **403 Forbidden**: Your API key lacks permissions for that model or endpoint.
   - **404 Not Found**: Check for typos in the endpoint path or base URL.
   - **400 / 422 Bad Request**: Missing \`Content-Type: application/json\` header or malformed JSON payload.
   - **CORS Error**: If calling from browser JavaScript (like localhost), the backend might not have enabled CORS headers.

2. **Quick test**:
   Try hitting the endpoint directly from your terminal using cURL:
\`\`\`bash
curl -X POST https://api.yourprovider.com/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "test-model", "messages": [{"role": "user", "content": "hi"}]}'
\`\`\`

What exact error message or status code are you seeing right now? Drop the snippet and we'll fix it together!`
    };
  }

  // 4. Simple scientific & educational inquiries
  if (p.includes('photosynthesis')) {
    return {
      model: model?.name || 'Pulse',
      latency: defaultLatency,
      webResearch: null,
      reasoning: null,
      legalMatrix: null,
      citations: null,
      content: `Photosynthesis is the process that plants, algae, and some bacteria use to turn sunlight, carbon dioxide, and water into food (sugar) and oxygen.

Here is how it works:
- Inside green plant leaves, a pigment called **chlorophyll** absorbs sunlight.
- That light energy powers a chemical reaction that splits water ($H_2O$), releasing oxygen ($O_2$) into the air for us to breathe.
- The plant then combines the remaining hydrogen with carbon dioxide ($CO_2$) absorbed from the air to create **glucose** ($C_6H_{12}O_6$), which it uses as fuel for growth.

In short, it's nature's way of converting light into living energy.`
    };
  }

  // 5. Deep technical inquiries
  if (p.includes('neural network') && (p.includes('deeply') || p.includes('deep') || p.includes('detail'))) {
    return {
      model: model?.name || 'Pulse',
      latency: defaultLatency,
      webResearch: null,
      reasoning: null,
      legalMatrix: null,
      citations: null,
      content: `At its core, a neural network is a parameterized mathematical function that learns to approximate complex mappings ($f: X \\to Y$) by adjusting internal numerical weights based on training data.

### 1. The Fundamental Unit: The Artificial Neuron
A single neuron takes multiple input signals $\\mathbf{x} = [x_1, x_2, \\dots, x_n]$, calculates a weighted sum plus a bias offset, and passes the result through a non-linear activation function:
$$z = \\sum_{i=1}^n w_i x_i + b = \\mathbf{w}^T \\mathbf{x} + b$$
$$a = \\sigma(z)$$

- **Weights ($\\mathbf{w}$)**: Represent the importance or sensitivity of each input feature.
- **Bias ($b$)**: Shifts the activation threshold independently of inputs.
- **Activation Function ($\\sigma$)**: Introduces non-linearity (e.g., **ReLU**, **GELU**, **Sigmoid**). Without non-linearities, stacking 100 layers would mathematically collapse into a single linear matrix multiplication.

### 2. Forward Propagation
In a deep feedforward network, information flows sequentially through multiple hidden layers:
$$\\mathbf{h}^{(1)} = \\sigma(\\mathbf{W}^{(1)} \\mathbf{x} + \\mathbf{b}^{(1)})$$
$$\\mathbf{h}^{(2)} = \\sigma(\\mathbf{W}^{(2)} \\mathbf{h}^{(1)} + \\mathbf{b}^{(2)})$$
$$\\hat{\\mathbf{y}} = g(\\mathbf{W}^{(L)} \\mathbf{h}^{(L-1)} + \\mathbf{b}^{(L)})$$
Each successive layer extracts higher-level hierarchical representations (e.g., edges $\\to$ contours $\\to$ object parts $\\to$ full scene objects).

### 3. Objective Function & Loss
To train the network, a loss function $L(\\hat{\\mathbf{y}}, \\mathbf{y})$ quantifies prediction error:
- **Mean Squared Error (MSE)** for continuous regression tasks.
- **Cross-Entropy Loss** for classification probabilities:
$$L = -\\sum_{k} y_k \\log(\\hat{y}_k)$$

### 4. Backpropagation & Optimization
Backpropagation applies the multivariate calculus **chain rule** to compute how every weight in the network contributed to the final error:
$$\\frac{\\partial L}{\\partial \\mathbf{W}^{(l)}} = \\frac{\\partial L}{\\partial \\mathbf{z}^{(l)}} \\cdot (\\mathbf{h}^{(l-1)})^T$$

An optimization algorithm (like **SGD**, **Momentum**, or **Adam**) then iteratively updates the parameters in the direction that minimizes loss:
$$\\mathbf{W} \\leftarrow \\mathbf{W} - \\eta \\nabla_{\\mathbf{W}} L$$

Through millions of tiny adjustments across batches of data, the network converges toward accurate generalization.`
    };
  }

  // 6. Research queries / Documentation summaries
  if (p.includes('groq api') || p.includes('documentation') || webResearchResult) {
    const researchSnippet = webCitations.length > 0
      ? `\n\n### Verified Reference Sources:\n` + webCitations.map((c, i) => `[${i + 1}] **${c.title}** (${c.ref})`).join('\n')
      : '';

    return {
      model: model?.name || 'Pulse',
      latency: defaultLatency,
      webResearch: webResearchResult,
      reasoning: null,
      legalMatrix: null,
      citations: webCitations.length > 0 ? webCitations : null,
      content: `Here is a clear summary of the latest Groq API architecture and capabilities:

### Core Architecture
- **Groq LPU™ (Language Processing Unit)**: Unlike conventional GPUs that rely on high-bandwidth memory parallelism, Groq's Tensor Streaming Processor (TSP) architecture provides deterministic, ultra-low latency compute for sequential token generation.
- **Inference Speeds**: Typically reaches 200–500+ tokens per second on open-weights frontier models.

### API Specifications
- **OpenAI Compatibility**: Groq is fully drop-in compatible with the OpenAI API specification (\`https://api.groq.com/openai/v1\`).
- **Endpoints**: Supports \`/v1/chat/completions\` (both standard and Server-Sent Events streaming with \`stream: true\`), \`/v1/models\`, and audio transcription with Whisper.
- **Authentication**: Uses standard HTTP Bearer tokens via \`Authorization: Bearer <gsk_...>\`.
- **Top Models**:
  - \`openai/gpt-oss-120b\` & \`openai/gpt-oss-20b\` (Flagship reasoning & high-velocity streaming)
  - \`qwen/qwen3.8-27b\` (Formal mathematical proofs and logic)
  - \`whisper-large-v3-turbo\` (Speech-to-text transcription)${researchSnippet}`
    };
  }

  // 7. Natural general conversational fallback
  return {
    model: model?.name || 'Pulse',
    latency: defaultLatency,
    webResearch: (webCitations.length > 0) ? webResearchResult : null,
    reasoning: null,
    legalMatrix: null,
    citations: (webCitations.length > 0) ? webCitations : null,
    content: `I'd be happy to help with that! Could you share a few more details about what you're aiming to do or what specific aspect you'd like to dive into? That way I can give you the most practical and direct answer.`
  };
}
