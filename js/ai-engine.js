/**
 * ReturnFlow - AI Decision Engine (Simulated DMN & ML Evaluation)
 * Deterministic business logic simulating automated LLM + Computer Vision + Policy Engine.
 */

const AiDecisionEngine = {
  /**
   * Evaluates return parameters against enterprise policies and simulated ML risk models.
   * @param {Object} data 
   * @returns {Object} Full AI Assessment output with confidence, reasoning, and policy checks
   */
  evaluate(data) {
    const value = parseFloat(data.purchaseValue) || 0;
    const days = parseInt(data.daysSincePurchase) || 0;
    const reason = data.returnReason || 'Changed Mind';
    const condition = data.condition || 'Opened';
    const category = data.category || 'Electronics';
    const notes = (data.customerNotes || '').toLowerCase();
    const hasEvidence = data.hasEvidence !== false && (data.evidenceCount > 0 || (data.evidenceList && data.evidenceList.length > 0));
    const vendor = data.vendor || 'Direct Fulfillment';

    // 1. Policy Checks
    const isWithin30Days = days <= 30;
    const isUnderAutoApproveLimit = value <= 5000;
    const isHighValue = value >= 10000;

    // Fraud score baseline computation
    let fraudScore = 6;
    if (reason === 'Suspected Fraud' || notes.includes('empty box') || notes.includes('counterfeit') || notes.includes('wrong item') && value > 15000) {
      fraudScore += 65;
    }
    if (days > 30) fraudScore += 20;
    if (condition === 'Damaged' && !hasEvidence) fraudScore += 25;
    if (value > 25000) fraudScore += 15;
    if (notes.includes('urgent') || notes.includes('immediately')) fraudScore += 5;
    fraudScore = Math.min(Math.max(fraudScore, 4), 96);

    let riskLevel = 'Low';
    if (fraudScore >= 60 || days > 30 || (isHighValue && (reason === 'Damaged' || reason === 'Defective'))) {
      riskLevel = 'High';
    } else if (fraudScore >= 25 || isHighValue || reason === 'Damaged' || reason === 'Defective') {
      riskLevel = 'Medium';
    }

    // Determine Suggested Decision, Confidence, and Detailed Reasoning
    let suggestedDecision = 'AUTO APPROVE';
    let confidence = 94;
    let reasoning = '';
    let eligibility = 'Eligible';
    let recommendedAction = '';
    let requiredEvidence = 'Proof of purchase verified.';
    let vendorLiability = false;
    let disposition = 'Restock';

    const policyChecks = [
      {
        name: 'Return Window Policy (<= 30 Days)',
        passed: isWithin30Days,
        details: isWithin30Days ? `Day ${days} is within standard 30-day window.` : `Day ${days} violates standard 30-day window.`
      },
      {
        name: 'Auto-Approval Value Ceiling (<= ₹5,000)',
        passed: isUnderAutoApproveLimit,
        details: isUnderAutoApproveLimit ? `Value ₹${value.toLocaleString('en-IN')} is below ₹5,000 auto-decision threshold.` : `Value ₹${value.toLocaleString('en-IN')} exceeds auto-approve threshold.`
      },
      {
        name: 'Visual Evidence Integrity Verification',
        passed: hasEvidence || (reason !== 'Damaged' && reason !== 'Defective'),
        details: hasEvidence ? 'Supporting image/document proof submitted and OCR-verified.' : 'Missing visual proof of reported physical defect/damage.'
      },
      {
        name: 'Category Returnability Rule',
        passed: !(category === 'Electronics' && days > 15 && reason === 'Changed Mind'),
        details: (category === 'Electronics' && days > 15 && reason === 'Changed Mind') ? 'Electronics change of mind restricted to 15 days.' : 'Product category eligible for return.'
      },
      {
        name: 'Supplier Warranty Recovery Assessment',
        passed: true,
        details: (reason === 'Defective' || reason === 'Defective Product') ? `Defect mapped to supplier warranty agreement: ${vendor}.` : 'No supplier recovery trigger.'
      }
    ];

    // Rule Evaluations
    if (!isWithin30Days) {
      // RULE: Exceeded Return Window
      suggestedDecision = 'REJECT / ESCALATE';
      confidence = 98;
      riskLevel = 'High';
      eligibility = 'Policy Violation (Window Exceeded)';
      reasoning = `Return request submitted ${days} days after purchase (exceeds maximum 30-day policy). High-risk exception requiring manager discretion for goodwill concession.`;
      recommendedAction = 'Route to Returns Manager for formal policy rejection letter or customer goodwill store credit.';
      disposition = 'Scrap';
    } else if (reason === 'Suspected Fraud' || fraudScore >= 60) {
      // RULE: Fraud Indicator
      suggestedDecision = 'MANUAL INVESTIGATION';
      confidence = 92;
      riskLevel = 'High';
      eligibility = 'High Risk / Potential Fraud Alert';
      reasoning = `Anomaly detection engine flagged high fraud risk (Score: ${fraudScore}/100). Discrepancy between reported claim and packaging/weight characteristics.`;
      recommendedAction = 'Hold automatic refund. Dispatch case to Security & Audit team for carrier weight verification and depot CCTV review.';
      requiredEvidence = 'Outbound WMS weigh-in manifest and carrier tamper-evident tape audit.';
      disposition = 'Liquidate';
    } else if (reason === 'Defective' || reason === 'Defective Product') {
      vendorLiability = true;
      if (isUnderAutoApproveLimit && hasEvidence) {
        suggestedDecision = 'AUTO APPROVE + VENDOR CLAIM';
        confidence = 96;
        riskLevel = 'Low';
        eligibility = 'Eligible (Auto Warranty Settlement)';
        reasoning = `Defect reported within policy window. Value ₹${value.toLocaleString('en-IN')} is within auto-settlement limits. Defect diagnosis matched against supplier (${vendor}) warranty matrix.`;
        recommendedAction = 'Issue instant refund to original payment source; raise automatic 100% vendor chargeback claim.';
        disposition = 'Refurbish';
      } else {
        suggestedDecision = 'MANUAL REVIEW + VENDOR CLAIM';
        confidence = 88;
        riskLevel = isHighValue ? 'High' : 'Medium';
        eligibility = 'Eligible Pending Vendor Review';
        reasoning = `High-value defective item (₹${value.toLocaleString('en-IN')}). Evidence submitted confirms functional impairment. Human sign-off required prior to high-value disbursement.`;
        recommendedAction = 'Returns Manager review to validate serial number; create vendor recovery claim upon approval.';
        disposition = 'Refurbish';
      }
    } else if (reason === 'Damaged' || reason === 'Damaged Item') {
      if (hasEvidence && isUnderAutoApproveLimit) {
        suggestedDecision = 'AUTO APPROVE';
        confidence = 93;
        riskLevel = 'Low';
        eligibility = 'Eligible (Damage Confirmed)';
        reasoning = `Transit/packaging damage verified via uploaded image inspection. Purchase value ₹${value.toLocaleString('en-IN')} is eligible for straight-through refund.`;
        recommendedAction = 'Approve customer refund and generate warehouse scrap/liquidation tag.';
        disposition = 'Liquidate';
      } else {
        suggestedDecision = 'MANUAL REVIEW';
        confidence = 86;
        riskLevel = 'Medium';
        eligibility = 'Eligible with Physical Inspection';
        reasoning = `Item reported damaged with order value ₹${value.toLocaleString('en-IN')}. Requires carrier transit inspection check to differentiate packaging crush from consumer misuse.`;
        recommendedAction = 'Returns Manager review carrier proof of delivery notes before refund authorization.';
        disposition = condition === 'Damaged' ? 'Liquidate' : 'Refurbish';
      }
    } else if (reason === 'Size/Fit' || reason === 'Size/Fit Issue' || reason === 'Changed Mind') {
      if (isUnderAutoApproveLimit && condition === 'New') {
        suggestedDecision = 'AUTO APPROVE';
        confidence = 99;
        riskLevel = 'Low';
        eligibility = 'Fully Eligible';
        reasoning = `Clean return within 30-day window. Item in pristine condition with tags intact. Safe for automated restock.`;
        recommendedAction = 'Auto-approve refund; dispatch return shipping label with Restock warehouse routing.';
        disposition = 'Restock';
      } else if (isHighValue) {
        suggestedDecision = 'MANUAL REVIEW';
        confidence = 85;
        riskLevel = 'Medium';
        eligibility = 'Eligible High-Value Review';
        reasoning = `High value item (₹${value.toLocaleString('en-IN')}) returned for discretionary reasons. Verification of intact seals required before disbursement.`;
        recommendedAction = 'Queue in Returns Manager review list for seal validation upon hub arrival.';
        disposition = 'Restock';
      } else {
        suggestedDecision = 'AUTO APPROVE';
        confidence = 95;
        riskLevel = 'Low';
        eligibility = 'Eligible';
        reasoning = `Standard return within policy parameters. Low risk customer account profile.`;
        recommendedAction = 'Auto-approve refund upon first carrier scan.';
        disposition = 'Restock';
      }
    } else {
      // Default fallback
      suggestedDecision = isUnderAutoApproveLimit ? 'AUTO APPROVE' : 'MANUAL REVIEW';
      confidence = 90;
      riskLevel = isHighValue ? 'Medium' : 'Low';
      eligibility = 'Standard Eligibility';
      reasoning = `Standard case parameters evaluated against enterprise retail return matrices.`;
      recommendedAction = isUnderAutoApproveLimit ? 'Auto-approve refund.' : 'Returns Manager review.';
      disposition = 'Restock';
    }

    return {
      eligibility,
      riskLevel,
      fraudScore,
      fraudRisk: `${riskLevel} (Score: ${fraudScore}/100)`,
      suggestedDecision,
      confidence,
      reasoning,
      policyChecks,
      requiredEvidence,
      recommendedAction,
      vendorLiability,
      dispositionRecommendation: disposition
    };
  }
};
