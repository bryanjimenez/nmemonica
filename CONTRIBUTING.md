# Contributing to the Nmemonica project

Nmemonica is a proof of concept / experimental project - still very rough around the edges, but the application is nonetheless usable and can fulfill it's core objectives: Learn kanji, vocabulary and phrases using spaced repetition. This app is a place where you can collect and review the vocabulary you encounter along your language learning adventure.

Contributions to this project are appreciated. Thank you for taking the time to contribute.

## Ways to contribute
- Documentation
- Static analysis/lint fixes
- Type fixes
- Accessibility improvements
- Unit tests
- Bug fixes

## Reporting Bugs
Please do not open an issue to report a security vulnerability. In case you have discovered a security vulnerability please follow the [SECURITY.md](./SECURITY.md) reporting instructions.

For non security-related bugs please open an issue and provide:
- A description
- Steps to reproduce
- Expected vs actual result
- Basic device information (Desktop vs Mobile, OS, Browser)

## Suggesting Features
Open an issue with the use case you have in mind. Please provide the following:
- What: Describe the use case
- Why: A reason why it's important
- How: A step by step solution

## Getting Started
1. Fork the repository
2. Clone your work locally (replace `[my-github-user-name]` with your username)
```bash
git clone https://github.com/[my-github-user-name]/nmemonica.git
cd ./nmemonica
```
3. Install project dependencies
```bash
npm install
```

## Making Changes
1. Create a branch for your fix/feature/test.
```bash
git switch -c my-new-feature
```
2. Make your changes
3. Write tests
```bash
# to run the unit tests
npm run test

# to check test coverage
npm run coverage
```
4. Commit your changes with clear subject and a signoff (see: [DCO](#developer-certificate-of-origin))
```bash
git add -u
git commit -m "FIX: my first bug fix" --signoff
```
5. Push to your fork and open a Pull Request against the `main` branch.

## Submitting a Pull Request
Please make sure of the following:
- All tests are passing
- Make documentation updates if necessary
- Agree to the Developer Certificate of Origin with signoff commits (see below DCO)

## Developer Certificate of Origin
All contributor submitted PR commits require signoff. The inclusion of the signoff statement in your commits acknowledges that you agree to the Developer Certificate of Origin ([DCO](https://developercertificate.org/)). Note that this signoff requirement is unrelated to cryptographically signing a commit with a digital signature.

> Developer Certificate of Origin
> Version 1.1
> 
> Copyright (C) 2004, 2006 The Linux Foundation and its contributors.
> 
> Everyone is permitted to copy and distribute verbatim copies of this
> license document, but changing it is not allowed.
> 
> 
> Developer's Certificate of Origin 1.1
> 
> By making a contribution to this project, I certify that:
> 
> (a) The contribution was created in whole or in part by me and I
>     have the right to submit it under the open source license
>     indicated in the file; or
> 
> (b) The contribution is based upon previous work that, to the best
>     of my knowledge, is covered under an appropriate open source
>     license and I have the right under that license to submit that
>     work with modifications, whether created in whole or in part
>     by me, under the same open source license (unless I am
>     permitted to submit under a different license), as indicated
>     in the file; or
> 
> (c) The contribution was provided directly to me by some other
>     person who certified (a), (b) or (c) and I have not modified
>     it.
> 
> (d) I understand and agree that this project and the contribution
>     are public and that a record of the contribution (including all
>     personal information I submit with it, including my sign-off) is
>     maintained indefinitely and may be redistributed consistent with
>     this project or the open source license(s) involved.

To signoff your commits, you can:
```bash
# sign off the current commit
git commit -m "my contribution description..." --signoff

# sign off your last commit
git commit --amend --signoff
```
