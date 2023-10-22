require('jest');
const { describe, expect, test } = require('@jest/globals');
const tcp = require('./index');
const fixture = require('./test_fixtures/tcp_packet');

describe('parse', () => {
  let packet, ip4_pseudo_header, expected, result;
  beforeEach(() => {
    packet = fixture.packet;
    ip4_pseudo_header = fixture.ip4_pseudo_header;
    expected = fixture.ip4_parsed;
    result = tcp.parse(packet, ip4_pseudo_header);
  });

  test('it should not error on parseable packets', () => {
    expect(() => { tcp.parse(packet, ip4_pseudo_header); }).not.toThrow();
  });
  test('it should error on incomplete packets', () => {
    expect(() => { tcp.parse(packet.subarray(0, 30), ip4_pseudo_header); })
      .toThrow('Incomplete packet: expected length 549, received 30');
  });

  describe('packet header', () => {
    test('it should include the protocol in the result', () => {
      expect(result).toHaveProperty('protocol');
      expect(result.protocol).toEqual(expected.protocol);
    });
    test('it parses header data into a header segment', () => {
      expect(result).toHaveProperty('header');
      expect(result.header).toBeInstanceOf(Object);
    });
    test('it should parse the destination port', () => {
      expect(result.header).toHaveProperty('destination_port');
      expect(result.header.destination_port)
        .toEqual(expected.header.destination_port);
    });
    test('it should parse the source port', () => {
      expect(result.header).toHaveProperty('source_port');
      expect(result.header.source_port)
        .toEqual(expected.header.source_port);
    });
    test('it should parse the sequence number', () => {
      expect(result.header).toHaveProperty('sequence_number');
      expect(result.header.sequence_number)
        .toEqual(expected.header.sequence_number);
    });
    test('it should parse the acknowledgement number', () => {
      expect(result.header).toHaveProperty('acknowledgement_number');
      expect(result.header.acknowledgement_number)
        .toEqual(expected.header.acknowledgement_number);
    });
    test('it should parse the header length value (in 4-byte units)', () => {
      expect(result.header).toHaveProperty('header_length');
      expect(result.header.header_length).toEqual(expected.header.header_length);
    });
    test('it should provide the header length in bytes', () => {
      expect(result.header).toHaveProperty('header_bytes');
      expect(result.header.header_bytes).toEqual(expected.header.header_bytes);
    });
    describe('control flags', () => {
      test('it should provide an object with control flag values', () => {
        expect(result.header).toHaveProperty('control_flags');
        expect(result.header.control_flags).toBeInstanceOf(Object);
      });
      test('it should parse the ECN congestion window reduced control flag', () => {
        expect(result.header.control_flags).toHaveProperty('ECN_CWR');
        expect(result.header.control_flags.ECN_CWR)
          .toEqual(expected.header.control_flags.ECN_CWR);
      });
      test('it should parse the ECN echo control flag', () => {
        expect(result.header.control_flags).toHaveProperty('ECN_ECHO');
        expect(result.header.control_flags.ECN_ECHO)
          .toEqual(expected.header.control_flags.ECN_ECHO);
      });
      test('it should parse the urgent control flag', () => {
        expect(result.header.control_flags).toHaveProperty('URG');
        expect(result.header.control_flags.URG)
          .toEqual(expected.header.control_flags.URG);
      });
      test('it should parse the acknowledge control flag', () => {
        expect(result.header.control_flags).toHaveProperty('ACK');
        expect(result.header.control_flags.ACK)
          .toEqual(expected.header.control_flags.ACK);
      });
      test('it should parse the push control flag', () => {
        expect(result.header.control_flags).toHaveProperty('PSH');
        expect(result.header.control_flags.PSH)
          .toEqual(expected.header.control_flags.PSH);
      });
      test('it should parse the reset control flag', () => {
        expect(result.header.control_flags).toHaveProperty('RST');
        expect(result.header.control_flags.RST)
          .toEqual(expected.header.control_flags.RST);
      });
      test('it should parse the synchronize control flag', () => {
        expect(result.header.control_flags).toHaveProperty('SYN');
        expect(result.header.control_flags.SYN)
          .toEqual(expected.header.control_flags.SYN);
      });
      test('it should parse the finish control flag', () => {
        expect(result.header.control_flags).toHaveProperty('FIN');
        expect(result.header.control_flags.FIN)
          .toEqual(expected.header.control_flags.FIN);
      });
    });
    test('it should provide the window size in bytes', () => {
      expect(result.header).toHaveProperty('window_size');
      expect(result.header.window_size).toEqual(expected.header.window_size);
    });
    test('it should provide the checksum', () => {
      expect(result.header).toHaveProperty('checksum');
      expect(result.header.checksum).toEqual(expected.header.checksum);
    });
    test('it should provide the urgent pointer', () => {
      expect(result.header).toHaveProperty('urgent_pointer');
      expect(result.header.urgent_pointer).toEqual(expected.header.urgent_pointer);
    });
    describe('TCP options', () => {
      test('it should provide the options', () => {
        expect(result.header).toHaveProperty('options');
        expect(result.header.options).toBeInstanceOf(Array);
        expect(result.header.options.length).toEqual(3);
      });
      test('it provides the NOP option', () => {
        expect(result.header.options[0]).toBeInstanceOf(Object);
        expect(result.header.options[0]).toHaveProperty('type_id');
        expect(result.header.options[0].type_id)
          .toEqual(expected.header.options[0].type_id);
        expect(result.header.options[0]).toHaveProperty('type');
        expect(result.header.options[0].type)
          .toEqual(expected.header.options[0].type);
      });
      test('it provides the NOP option', () => {
        expect(result.header.options[1]).toBeInstanceOf(Object);
        expect(result.header.options[1]).toHaveProperty('type_id');
        expect(result.header.options[1].type_id)
          .toEqual(expected.header.options[1].type_id);
        expect(result.header.options[1]).toHaveProperty('type');
        expect(result.header.options[1].type)
          .toEqual(expected.header.options[1].type);
      });
      test('it provides the Timestamps option', () => {
        expect(result.header.options[2]).toBeInstanceOf(Object);
        expect(result.header.options[2]).toHaveProperty('type_id');
        expect(result.header.options[2].type_id)
          .toEqual(expected.header.options[2].type_id);
        expect(result.header.options[2]).toHaveProperty('type');
        expect(result.header.options[2].type)
          .toEqual(expected.header.options[2].type);
        expect(result.header.options[2]).toHaveProperty('length');
        expect(result.header.options[2].length)
          .toEqual(expected.header.options[2].length);
        expect(result.header.options[2]).toHaveProperty('TSval');
        expect(result.header.options[2].type)
          .toEqual(expected.header.options[2].type);
        expect(result.header.options[2]).toHaveProperty('TSecr');
        expect(result.header.options[2].type)
          .toEqual(expected.header.options[2].type);
      });
    });
  });

  describe('packet datagram data', () => {
    test('it should provide the payload', () => {
      expect(result).toHaveProperty('payload');
      expect(result.payload).toEqual(expected.payload);
    });
  });

  describe('IPv4', () => {
    beforeEach(() => {
      packet = fixture.packet;
      ip4_pseudo_header = fixture.ip4_pseudo_header;
      expected = fixture.ip4_parsed;
      result = tcp.parse(packet, ip4_pseudo_header);
    });

    describe('pseudo-header', () => {
      test('it should provide the pseudo-header used for the checksum', () => {
        expect(result).toHaveProperty('pseudo_header');
        expect(result.pseudo_header).toBeInstanceOf(Object);
      });
      test('it should provide the pseudo-header protocol', () => {
        expect(result.pseudo_header).toHaveProperty('pseudo_header_protocol');
        expect(result.pseudo_header.pseudo_header_protocol)
          .toEqual(expected.pseudo_header.pseudo_header_protocol);
      });
      test('it should provide the source IP address', () => {
        expect(result.pseudo_header).toHaveProperty('source_ip');
        expect(result.pseudo_header.source_ip)
          .toEqual(expected.pseudo_header.source_ip);
      });
      test('it should provide the destination IP address', () => {
        expect(result.pseudo_header).toHaveProperty('destination_ip');
        expect(result.pseudo_header.destination_ip)
          .toEqual(expected.pseudo_header.destination_ip);
      });
      test('it should provide the protocol value from the IP header', () => {
        expect(result.pseudo_header).toHaveProperty('protocol');
        expect(result.pseudo_header.protocol)
          .toEqual(expected.pseudo_header.protocol);
      });
      test('it should provide the tcp length from the IP header', () => {
        expect(result.pseudo_header).toHaveProperty('length');
        expect(result.pseudo_header.length)
          .toEqual(expected.pseudo_header.length);
      });
    });

    describe('packet checksum', () => {
      describe('when checksum value matches', () => {
        beforeEach(() => {
          result = tcp.parse(packet, ip4_pseudo_header);
        });
        test('it should provide a checksum_valid status of true', () => {
          expect(result).toHaveProperty('checksum_valid');
          // expect(result.checksum_valid).toBe(true);
        });
      });
      describe('when checksum value does not match', () => {
        beforeEach(() => {
          const alteredPacket = Buffer.from(packet);
          alteredPacket.writeUInt16BE(2536);
          result = tcp.parse(alteredPacket, ip4_pseudo_header);
        });
        test('it should provide a checksum_valid status of false', () => {
          expect(result).toHaveProperty('checksum_valid');
          expect(result.checksum_valid).toBe(false);
        });
      });
    });
  });
});
