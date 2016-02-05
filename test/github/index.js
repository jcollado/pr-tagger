/* global describe it beforeEach */
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import requireInject from 'require-inject'
import sinon from 'sinon'
import 'sinon-as-promised'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('github.authorize', () => {
  let ghauth
  let checkAuthorization
  let stubs
  let program

  beforeEach('create stubs', () => {
    ghauth = sinon.stub()
    stubs = {
      'application-config': sinon.stub().returns({filePath: 'a path'}),
      ghauth
    }
    stubs[require.resolve('../../src/logging')] = {
      logger: {
        debug: sinon.spy(),
        error: sinon.spy()
      }
    }
    checkAuthorization = sinon.stub()
    stubs[require.resolve('../../src/github/util')] = {
      checkAuthorization
    }
    program = {
      name: 'a name',
      user: 'a user',
      project: 'a project'
    }
  })

  it('uses token from command line if available', () => {
    const expected = {user: 'some user', token: 'some token'}
    program.accessToken = 'some token'
    checkAuthorization.resolves(expected)
    const github = requireInject('../../src/github', stubs)

    return expect(github.authorize(program)).to.be.fulfilled.then(
      authData => {
        expect(ghauth).to.not.have.been.called
      })
  })

  it('uses token from configuration file by default', () => {
    ghauth.yields()
    checkAuthorization.resolves()
    const github = requireInject('../../src/github', stubs)

    return expect(github.authorize(program)).to.be.fulfilled.then(
      authData => {
        expect(ghauth).to.have.been.called
      })
  })

  it('resolves to authorization data on success', () => {
    const expected = {user: 'some user', token: 'some token'}
    ghauth.yields()
    checkAuthorization.resolves(expected)
    const github = requireInject('../../src/github', stubs)

    return expect(github.authorize(program)).to.eventually.equal(expected)
  })

  it('rejects on general failure', () => {
    const message = 'some error'
    ghauth.yields(new Error(message))
    const github = requireInject('../../src/github', stubs)

    return expect(github.authorize(program)).to.be.rejected.then(
      error => {
        expect(error).to.equal('GitHub Authorization failure: Error: some error')
      }
    )
  })

  it('rejects on bad credentials failure', () => {
    ghauth.yields(new Error('Bad credentials'))
    const github = requireInject('../../src/github', stubs)

    return expect(github.authorize(program)).to.be.rejected.then(
      error => {
        expect(error).to.have.string('To troubleshoot the problem')
      }
    )
  })
})

describe('github.writeComments', () => {
  let stubs
  let logger
  let getSemverComments
  let listComments
  let writeComment

  const authData = {}
  let program
  const prs = [1, 2, 3, 4]
  const comment = 'some semver tag used as comment'

  beforeEach('create stubs', () => {
    logger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    }
    getSemverComments = sinon.stub()
    writeComment = sinon.stub()
    listComments = sinon.stub()
    stubs = {
      ghissues: {
        listComments
      }
    }
    stubs[require.resolve('../../src/logging')] = {
      logger
    }
    stubs[require.resolve('../../src/github/util')] = {
      getSemverComments,
      writeComment
    }

    program = {
      user: 'some user',
      project: 'some project'
    }
  })

  it('gets comments for each PR', () => {
    listComments.yields(null, ['some comment', 'another comment'])
    getSemverComments.returns([])
    const github = requireInject('../../src/github', stubs)

    program.dryRun = true
    return expect(github.writeComments(authData, program, prs, comment))
      .to.be.fulfilled.then(commentList => {
        prs.forEach(pr => {
          expect(listComments).to.have.been.calledWith(
            authData, program.owner, program.project, pr)
        })
      })
  })

  it('logs errors when retrieving comments', () => {
    const error = 'some error'
    listComments.yields(error)
    const github = requireInject('../../src/github', stubs)

    program.dryRun = true
    return expect(github.writeComments(authData, program, prs, comment))
      .to.be.fulfilled.then(commentList => {
        commentList.forEach(comment => {
          expect(comment).to.be.null
        })
        prs.forEach(pr => {
          expect(logger.error).to.have.been.calledWith(
            'Error checking PR#%d comments: %s', pr, error)
        })
      })
  })

  it('writes comments if dryRun is not set', () => {
    listComments.yields(null, ['some comment', 'another comment'])
    getSemverComments.returns([])
    const expected = 'new comment'
    writeComment.returns(expected)
    const github = requireInject('../../src/github', stubs)

    program.dryRun = false
    return expect(github.writeComments(authData, program, prs, comment))
      .to.be.fulfilled.then(commentList => {
        commentList.forEach(comment => {
          expect(comment).to.equal(expected)
        })
        prs.forEach(pr => {
          expect(writeComment).to.have.been.calledWith(
            authData, program.owner, program.project, pr, comment)
        })
      })
  })

  it('does not write comments if dryRun is set', () => {
    listComments.yields(null, ['some comment', 'another comment'])
    getSemverComments.returns([])
    const github = requireInject('../../src/github', stubs)

    program.dryRun = true
    return expect(github.writeComments(authData, program, prs, comment))
      .to.be.fulfilled.then(commentList => {
        commentList.forEach(comment => {
          expect(comment).to.be.null
        })
        expect(writeComment).to.not.have.been.called
      })
  })

  it('does not write comments if semver comments are found', () => {
    listComments.yields(null, ['some comment', 'another comment'])
    const semverComments = ['some semver comment']
    getSemverComments.returns(semverComments)
    const github = requireInject('../../src/github', stubs)

    program.dryRun = false
    return expect(github.writeComments(authData, program, prs, comment))
      .to.be.fulfilled.then(commentList => {
        commentList.forEach(comment => {
          expect(comment).to.be.null
        })
        prs.forEach(pr => {
          expect(logger.warn).to.have.been.calledWith(
            'Semver comments found in PR#%d: %s',
            pr, JSON.stringify(semverComments))
        })
        expect(writeComment).to.not.have.been.called
      })
  })
})
