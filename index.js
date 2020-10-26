const tcp = require('./lib/tcp');

/**
 * Parse a UDP packet
 * @param {Buffer} data - the UDP packet data as binary Buffer
 * @param {Buffer} pseudo_header - the IP pseudo-header as binary Buffer
 * @returns {{
 *   protocol: string,
 *   header: {
 *     destination_port: number,
 *     source_port: number,
 *     sequence_number: number,
 *     acknowledgement_number: number,
 *     header_length: number,
 *     header_bytes: number,
 *     control_flags: {
 *       ECN_CWR: boolean,
 *       ECN_ECHO: boolean,
 *       URG: boolean,
 *       ACK: boolean,
 *       PSH: boolean,
 *       RST: boolean,
 *       SYN: boolean,
 *       FIN: boolean
 *     },
 *     window_size: number,
 *     checksum: number,
 *     urgent_pointer: number
 *   },
 *   pseudo_header: {
 *     pseudo_header_protocol: string,
 *     source_ip: Buffer,
 *     destination_ip: Buffer,
 *     protocol: number,
 *     length: number
 *   },
 *   payload: Buffer,
 *   checksum_valid: boolean
 * }} - an object representing the fields from the TCP packet and pseudo-header
 */
function parse (data, pseudo_header) {
  // start here: this function is the entry point to this library.
  // put any supporting functions (for example, for dealing with
  // parsing of headers or differences between IPv4 and IPv6) in
  // the imported module ./lib/tcp.js
}

module.exports = {
  parse
};
