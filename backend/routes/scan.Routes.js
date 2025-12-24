import express from "express";
import { runEvilScan } from "../runners/evilscanRunner.js";

const router = express.Router();

router.post("/network", async (req, res) => {
  try {
    const { ips, ports } = req.body;
    
    console.log('Received scan request:', { ips, ports });
    
    if (!ips || !ports) {
      return res.status(400).json({ 
        success: false, 
        error: 'IPs and ports are required' 
      });
    }
    
    const results = await runEvilScan({ 
      target: ips, 
      port: ports,
      status: 'TROU', // T=timeout, R=refused, O=open, U=unreachable
      timeout: 2000
    });
    
    console.log(`Scan complete. Found ${results.length} results`);
    
    res.json({ success: true, results });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Scan failed' 
    });
  }
});

export default router;