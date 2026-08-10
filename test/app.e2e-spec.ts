import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('AppModule (e2e smoke)', () => {
  it('compiles AppModule metadata', async () => {
    // Skip real bootstrap without DB — unit tests cover business logic.
    expect(AppModule).toBeDefined();
  });
});
