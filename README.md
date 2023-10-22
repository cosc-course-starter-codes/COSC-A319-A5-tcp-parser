# COSC A319, Assignment A5: TCP Packet Parser

## Summary

In this assignment, you'll create and export a function that parses
a Transmission Control Protocol (TCP) packet.

## Background

### Transmission Control Protocol (TCP)

TCP is a Transport layer protocol, operating on layer 4 of the layered
network model, and is often found encapsulated as the payload of Internet
Protocol version 4 (IPv4) or Internet Protocol version 6 (IPv6) packets.
TCP is currently used for a large portion of the World-Wide Web data sent
over the Internet today.

TCP is a more complex protocol than its sibling protocol UDP. The
_connection-oriented_ nature of the TCP protocol adds a number more
complexities to the communication interaction than might be expected,
and in fact, TCP adds some functionality that would normally fall under
the responsibilities of Session layer services (layer 5 in the 7-layer
model, and part of layer 5 Application layer in the Internet 5-layer model).
These additions include "state variables" (information on the history
of the connection while it's active), quality of service information,
flow and congestion control mechanisms, and message segmentation.

### Ports and Sockets

As we saw in looking at UDP, addresses on the Transport layer are
called ports. Ports are 16-bit (2-byte) unsigned integer values
(between 0 and 65535), and address processes on a host. (Recall that
host-level addressing is handled at the Network layer using the Internet
Protocol's addressing schemes -- versions 4 and 6.)

Although ports are represented as simple unsigned integer
values, all ports are not the same. Port numbers are managed
by the Internet Assigned Numbers Authority (IANA) in the
[_Service Name and Transport Protocol Port Numbers Registry_](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml).
There are three classes of ports:

- Well-known ports (0 - 1023): assigned and controlled
- Registered ports (1024 - 49151): not assigned or controlled,
  but can be [registered with IANA](https://www.iana.org/form/ports-services)
  by organizations/entities to prevent duplication
- Dynamic ports (49152 - 65535): used as temporary or
  private ports; not assigned, controlled or registered

You will often make use of several of the well-known ports:

- 20 & 21 - file transfer protocol (FTP), data & control
- 22 - secure shell (SSH) remote server access
- 25 - SMTP email transport
- 53 - domain name service (DNS)
- 67 & 68 - DHCP server & client, likely used by your computer to
  find an available IP address to use on your local network
- 80 - HTTP, used for web pages and web-based communications
- 110 - POP3, email access
- 115 - SFTP, secure FTP using Secure Sockets Layer (SSL) encryption
- 143 - IMAP email access
- 443 - HTTPS, secure HTTP using Secure Sockets Layer (SSL) encryption

In addition, if you use a database, you may also run into
vendor registered ports, for example:

- 1433 - default connection port for MS SQL Server processes
- 3306 - default connection port for MySQL server processes
- 5432 - default connection port for PostgreSQL server processes
- 6379 - default connection port for Redis server processes
- 27017 - default connection port for MongoDB server processes

When combined with an IP address to address a specific process
on a specific host, the combination of port and IP address is
called a socket. A socket is an abstract concept representing
the address of a process on a host, and many programming language
standard libraries have socket abstractions that you can use
when building software.

### TCP Packet Structure

The packet structure of a TCP packet involves a variable-length
header containing several fields, which can be between 20 and 60
bytes. There are a number of important fields to consider here:

- source port (16-bit unsigned integer)
- destination port (16-bit unsigned integer)
- initial sequence number (32-bit unsigned integer)
- acknowledgement number (32-bit unsigned integer)
- header length (4-bit unsigned integer, specified in 4-byte units
  (so, value is between 5 and 15); packed with 4 bit of reserved
  space to make a single byte)
- control flags (1-bit each, packed into a single byte; see below for details)
- window size (16-bit unsigned integer)
- checksum (16-bit unsigned integer; see below for details)
- urgent pointer (16-bit unsigned integer)
- options field (between 0 and 40 bytes, padded to 4-byte boundaries)

The payload data if included, follows the header. Its size is controlled by the
transaction-determined window size (in the window size header field).

```{text}
TCP Packet Structure
|------------------------header---------------. . .-----|----------payload-. . .----|
0       4       8      12      16      20             20-60                         |
----------------------------------------------. . .-----------------------. . .------
| ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' . . . ' ' | ' ' ' ' ' ' ' ' . . . ' ' |
| 2B| 2B|4 bytes|4 bytes| | | 2B| 2B| 2B|    Options    |       Payload Data        |
|Src|Dst|  Seq  |  Ack  |H|F|Win|Chk|Urg| 0 to 40 bytes |    size controlled by     |
|Prt|Prt|  Num  |  Num  |L| |Siz|Sum|Ptr|in 4B multiples|      by window size       |
----------------------------------------------. . .------------------------. . .-----
```

### TCP Transactions and Related Header Fields

TCP-based communication is carried out through "transactions", however
these transactions are not the same as what you may understand in other
areas like a banking transaction or a database transaction. TCP
transactions don't involve the simultaneous coordination of multiple
resources across a communication channel -- instead, they are a way of
packing several request-response pairs into one connection setup and
teardown. Thus, these transactions involve three phases: setup, data
transfer, and release. These are managed through messages employing the
control flags to identify the purpose of the message.

The control flags one bit each, packed into byte 13 of the header (labelled
`F` in the diagram), and are the following:

- `ECN-CWR` - Explicit Congestion Notification, Congestion Window Reduced (acknowledge signal from receiver)
- `ECN-Echo` - Explicit Congestion Notification, Echo (signal sender to reduce)
- `URG` - Urgent (flags that the Urgent Pointer field is valid, indicating raised priority of the segment)
- `ACK` - Acknowledgement (flags that the Acknowledgement Number field is valid)
- `PSH` - Push (flags that the segment data should not be buffered, but rather sent directly to the application in real-time)
- `RST` - Reset (flags that the connection should be aborted; governed by rules due to TCP connection hijacking)
- `SYN` - Synchronize (flags that the hosts should synchronize sequence numbers and establish a connection)
- `FIN` - Finish (flags that the sender has finished sending data and initiated a close of the connection)

Connections are setup through a _three-way handshake_:

1. Client `----SYN--->` Server
2. Client `<-SYN,ACK--` Server
3. Client `----ACK--->` Server

Following the connection handshake, data transfer begins in the
form of request-response pairs between the Client and Server system.
Once the data has been completely transferred over possibly many
request-response pairs, upon an empty response from the server
acknowledging the full amount of data, the connection is closed
via a _connection release_ exchange:

1. Client `<-FIN--` Server
2. Client `--ACK->` Server
3. Client `--FIN->` Server
4. Client `<-ACK--` Server

As part of a connection setup, the initial sequence numbers, receive
buffer space available locally for data, and possibly the maximum
segment size (MSS) of each party are shared. MSS is usually the data link
MTU minus IP and TCP header sizes, but is sometimes set at 512 or 536 bytes.
(MTU is the maximum transmission unit, which we'll learn more about when
we discuss the Internet Protocol, or IP.)

Every byte of data transferred in a TCP transaction is acknowledged (as
well as every non-data request or response) by increment of the sequence
number header field. In this way, the sender can understand what data the
recipient has received so far, and can resend data that has not been
acknowledged if needed. This also allows for some flow control. Data
transfer uses the window size to govern how much data can be sent
unacknowledged. This is often referred to as _sliding window flow control_,
whereby the window size specified marks the maximum number of bytes that
the sender can send without acknowledgement by the recipient of prior data
sent. When a new acknowledgement is received by the sender, if there is no
gap in the acknowledgement number, the available window for sending data
is increased by the number of bytes acknowledged. Further flow control
is accomplished through the `ECN` (explicit congestion control) flag bits
in the packet header, which when set, indicate that the window size should
temporarily be set to zero, preventing further sends until the congestion
is cleared.

### The TCP Options Field

Options extend the TCP header, and are used to provide additional information
about the segment and how to handle it. Options have a multi-byte structure
as follows:

```{text}
TCP Option
|-------. . .----
0 1 2           |
--------. . .----
| ' ' '       ' |
| | |   Option  |
|T|L|    Data   |
| | |(L-2) bytes|
--------. . .----
```

There are several option types (`T`) with varying lengths `L`. Note that the
option length (`L`) field specifies the length including the initial two bytes,
so option data length is always `L - 2` bytes. Various option types and their
meanings, with references, can be found in
[IANA's TCP Option Kind Numbers list](https://www.iana.org/assignments/tcp-parameters/tcp-parameters.xhtml).

When parsing options for this assignment, you'll need to provide both the numeric option type `T` as the field `type_id`, as well as a string with the option type name. For the option type name field `type`, you will use the option name as listed in the _Meaning_ column of Table 12.2 of your text _The Illustrated Network_. Parsed options should also present their byte length `L` as the `length` field and any relevant fields (using their abbreviated names) as defined by the RFC listed in Table 12.2 that defines the option. RFCs can be found at [rfc-editor.net](http://rfc-editor.net).

#### The Checksum Field and IP Pseudo-headers

Similar to UDP, the checksum of the TCP header makes use of the
IP pesudo-header. A product of the long period during development
of the internet when the Network and Transport layer protocols were
not distinct, the checksum of a TCP packet is calculated on an
augmented version of the packet that includes a _pseudo-header_ of
data from the encapsulating IP packet. Because the fields in the
IPv4 and IPv6 packet headers differ significantly, so also does the
TCP IPv4 pseudo-header from the TCP IPv6 pseudo-header. Both
pseudo-headers include the host addresses for source and destination,
as well as the protocol ID for the encapsulated packet (TCP for IPv4,
but could be different for IPv6), and the TCP length value from the
IP packet header. Both pseudo-headers also employ a filler of all
zeros to align data to 4-byte boundaries.

The TCP IPv4 and UDP IPv6 pseudo-header structures are included below.
Byte 9 in the IPv4 pseudo-header, labeled `Pr` is the _Protocol_ field
of the IPv4 header. Similarly, byte 39 of the IPv6 pseudo-header,
labeled `N H` is the _Next Header_ field of the IPv6 packet header.
These fields are 1 byte each, and take unsigned 8-bit integer values
identifying the protocol of the encapsulated packet. Those [protocol
numbers](https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml)
are also managed by IANA. The protocol number for TCP is 6.

```{text}
UDP IPv4 Pseudo-header Structure
0           4           8          12
-------------------------------------
|  '  '  '  |  '  '  '  |  '  '  '  |
|  4 bytes  |  4 bytes  |1B|1B| 2B  |
|   Source  |    Dest   |  |Pr| TCP |
|    IPv4   |    IPv4   |0s|  | Len |
-------------------------------------
```

```{text}
UDP IPv6 Pseudo-header Structure
0       4       8      12      16      20      24      28      32      36      40
---------------------------------------------------------------------------------
| ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' | ' ' ' |
|           16 bytes            |           16 bytes            |  TCP  |     |N|
|      Source IPv6 Address      |   Destination IPv6 Address    |  Len  |     |H|
|                               |                               |       | 0s  | |
---------------------------------------------------------------------------------
```

The relevant pseudo-header is attached at the beginning of the packet,
before the TCP header, and the checksum field of the TCP header is
zero-filled. Using that data, the checksum is then calculated as the
16-bit one's compliment of the one's compliment sum of the combined
data.

You can use the `createChecksum` function provided in `lib/checksum.js`
to compute the proper checksum for the data.

## Your Assignment

To complete this assignment, you need to write the body of the `parse`
function defined and exported from `index.js`. You do not need to worry
about asynchronous operations for this -- just be able to parse the
incoming byte `Buffer`(s) using the TCP protocol.

### Expected Output

Your function should return a JavaScript object with the fields and
structure specified below. Expected data types and descriptions are
included in parentheses.

```{text}
{
  protocol: "TCP",
  header: {
    destination_port: (16-bit unsigned integer value),
    source_port: (16-bit unsigned integer value),
    sequence_number: (32-bit unsigned integer value),
    acknowledgement_number: (32-bit unsigned integer value),
    header_length: (4-bit unsigned integer value),
    header_bytes: (header_length value, converted to units of bytes),
    control_flags: {
      ECN_CWR: (boolean, 0 = false, 1 = true),
      ECN_ECHO: (boolean, 0 = false, 1 = true),
      URG: (boolean, 0 = false, 1 = true),
      ACK: (boolean, 0 = false, 1 = true),
      PSH: (boolean, 0 = false, 1 = true),
      RST: (boolean, 0 = false, 1 = true),
      SYN: (boolean, 0 = false, 1 = true),
      FIN: (boolean, 0 = false, 1 = true)
    },
    window_size: (16-bit unsigned integer value),
    checksum: (16-bit 1's compliment checksum including IP pseudo-header),
    urgent_pointer: (16-bit unsigned integer values),
    options: [
      (an object for each option with relevant fields:
      {
        type_id: (numeric type as unsigned 8-bit integer),
        type: (string, type description per "Meaning" column of Table 12.2 in your textbook),
        length: (byte length of the option as unsigned 8-bit integer if relevant),
        (...other relevant fields, as defined by the RFC defining the option)
      })
    ]
  },
  pseudo_header: {
    pseudo_header_protocol: ("IPv4" or "IPv6"),
    source_ip: (IPv4 or IPv6 address),
    destination_ip: (IPv4 or IPv6 address),
    protocol: (unsigned integer value protocol identifier),
    length: (TCP packet length, unsigned integer value)
  },
  payload: (payload data in binary format as an Buffer with appropriate length),
  checksum_valid: (boolean, true if checksum is valid for data in packet)
}
```

### Bonus Challenge: Integration

Once this is complete and passing tests, copy this project into a new folder `lib/tcp` in
your Assignment A2 project (similar to what you did with the Assignment A1 code in the
`lib/ethernet` folder). Then, use this to parse the payload from UDP packets found by your
Assignment 2 async parser, and replace the `payload` key's current `Buffer` value with the
object structure above instead.

Note that you'll need to construct a couple dummy Ethernet frames that contain TCP
data. The simplest way to do this is just to capture a few packets on your computer. If
that's too difficult, you can just generate it by following the frame and packet formats.

> NOTE: Since we've postponed Assignment A2, this integration will not be feasible at the
time this is assigned. However, you should consider this bonus challenge active for the
remainder of the course and after, such that if and when Assignment A2 is set, you may include
this challege as an extension of it.

### Program Structure

While you must make your implementation pass automated tests that
will only use the exported `parse` function, you will likely want
to create several additional functions to help with parsing the data.
Each of these functions should be well-tested (repeatably via automation),
so that you can be confident of the accuracy and error-free quality of
your parsing code. Each of these functions should also include relevant
documentation [in JSdoc format](https://jsdoc.app/) about why they exist,
including expected inputs and outputs with data types.

In this repo, you will find a `lib` folder which contains several things
that should be helpful:

- `tcp.js` file - this is where you should put the protocol-specific
  parsing code you write

#### A note on working with binary in JavaScript

In this assignment (as in prior assignments in this course), you'll be
working with binary data in JavaScript. The interface for this work
will almost always be the `Buffer` class and its subclasses. Get to know
the `Buffer` class as soon as possible.

In particular, you'll need to be very familiar with the methods to read
various length unsigned integers, including the little endian (LE) and
big endian (BE) variants and how to choose which variant you need, and the
`subarray` method, as well as the typed subclasses of `Buffer`.

#### Bitwise operations to get to individual bit values in JavaScript

To work with individual bits, you'll need to take a byte and bit-shift or
bit-mask it to get the specific bit you're looking for. For example, you
to get the third bit from the left in `0x6d = 109 = 0b01101101`, you would
could do this by:

1. Create a bit mask having all zeros except the bit place you wish to
   extract, and a one in that bit position. For this example, that would
   look like: `0b00100000`.
2. Then, perform a
   [bitwise `AND` operation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_AND)
   between the byte you're extracting from and the bit mask you created.
   In JavaScript, this example looks like: `0x6d & 0b00100000`.
3. Finally, bit shift the result to remove the additional bits and get the
   flag value. In the example, you will want to
   [bit shift to the right](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift)
   by 5 positions (removing the 5 bit positions to the right of the one you
   care about): `(0x6d & 0b00100000) >> 5`

With this process, you can extract the value of a specific bit (a `0` or `1`),
and can then convert that value to a boolean value by comparing it with `1`.
All together, the example would look like this:

```{text}
const flagsField = 0x6d; // This would be whatever you read from your packet.
const bit3Value = (flagsField & 0b00100000) >> 5 === 1;
```

Note that if you know the base-10 values of these bit mask binary numbers, you
can also use those, simplifying the code a bit:

```{text}
const flagsField = 0x6d; // This would be whatever you read from your packet.
const bit3Value = (flagsField & 32) >> 5 === 1;
```

#### Getting started on the assignment

As with Assignments A1 and A4, in order to get started with the assignment, you'll want
to do the following things:

- Review this assignment description in detail, particularly the TCP packet structure and
  the notes about the various fields, checksum calculation oddities and pseudo-headers
- Explore JavaScript [Buffer](https://nodejs.org/dist/latest-v12.x/docs/api/buffer.html)
- Explore the bitwise operators in the [MDN JavaScript Operators reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators)
- Clone this repo to your computer
- Read through the comments and code included for you in `index.js` and `lib/tcp.js`
- Run the following at the command line from within the project directory (use `cd <path>`, replacing
  `<path>` with the folder path to your project directory, to get there):

  ```{sh}
  nvm install
  nvm use lts/*
  npm install
  npm test
  ```

During development, you may wish to run the tests in _watch_ mode, so that each time you save a file,
the tests that file affects will run. To do this, you can use:

```{sh}
npm test -- --watch
```

This assignment will also automatically check your code style for readability. To run those tests
at your own command line, you can use:

```{sh}
npm run lint
```

To check both tests and linting results, you can use the convenience command:

```{sh}
npm run check
```

### Submission and Feedback

You must submit your changes as commits to a new branch on the repository, and
create a pull request on the repository comparing that branch against the `main`
branch. As you push your commits on the new branch up to Github, they will be
added to the activity on this pull request.

In addition to the synchronous mechanism of requesting help via office hours
appointments, this pull request will be your mechanism for asking questions and
requesting help asynchronously during the course of this assignment. I will also
use this pull request to provide feedback on your work. I will provide feedback on
the completed assignment within a week of the due date of the assignment.
If you push your code earlier than the due date, I will try to provide
feedback as needed earlier.

I suggest that you push your work to Github as you make commits, and that you make
commits frequently as you work on the assignment. This way, if you have questions,
I will be able to review your work-in-progress and give more relevant answers and
feedback. If you have a question specific to a particular area of the code, note that
you can add comments inline on the pull request by clicking on the **Files changed** tab
of the pull request, then clicking the little blue `+` icon that appears when you hover
over a specific line of code.

I will do my best to respond to questions posed during the course of the assignment with
in a day of the ask. **If you want to ask a question or request early feedback, please tag
me in a comment on the pull request: `@nihonjinrxs`.**

Once you feel you have completed the assignment, you should submit the link to your pull
request on the assignment in Canvas.

Good luck, and I look forward to seeing what you create!
